import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components';
import {
  DEFAULT_STEP_INTERVAL_MS,
  ProgressChecklist,
} from '../components/molecules/ProgressChecklist';
import { SaveItineraryModal } from '../components/molecules/SaveItineraryModal';
import { CATEGORIES } from '../constants/categories';
import { COLORS } from '../constants/colors';
import { REGIONS } from '../constants/regions';
import { FONT } from '../constants/typography';
import { useContents } from '../hooks/useContents';
import { useContentsByIds } from '../hooks/useContentsByIds';
import { toErrorMessage } from '../services/apiError';
import { syncBasketToServer } from '../services/basketService';
import { generateItinerary } from '../services/generateItinerary';
import type { SavedItinerarySummary } from '../services/itineraryHistoryStorage';
import {
  generateItineraryPlan,
  saveItineraryPlan,
  updateItineraryPlan,
} from '../services/itineraryService';
import { addStop, moveStop, removeStop } from '../services/scheduleActions';
import { buildShareText, shareItinerary } from '../services/shareItinerary';
import { createShareLink } from '../services/shareService';
import type { CompanionType, StylePreference } from '../types/companion';
import type { ItineraryStop } from '../types/itinerary';
import type { Priority } from '../types/priority';
import { fromDateString } from '../utils/tripDate';

interface ItineraryResultScreenProps {
  selectedRegions: string[];
  selectedIds: string[];
  priorities: Record<string, Priority>;
  travelDate: string | null;
  duration: number | null;
  companion: CompanionType | null;
  stylePrefs: StylePreference[];
  initialStops?: ItineraryStop[];
  initialItineraryId?: string;
  isGuest: boolean;
  onRequireLogin: () => void;
  onSaved?: (summary: SavedItinerarySummary) => void;
  onGoHome: () => void;
}

const GENERATING_STEPS = [
  { label: '담은 장소 분석', sub: '위치·카테고리 확인' },
  { label: '이동 시간 계산', sub: '최적 동선 탐색' },
  { label: '운영 시간 확인', sub: '방문 가능 시간 매칭' },
  { label: '일정 구성', sub: '우선순위·흐름 반영' },
];

// ProgressChecklist가 단계를 다 보여주는 데 걸리는 실제 시간(체크리스트 애니메이션 총 길이).
// 실제 생성이 이보다 먼저 끝나도 화면이 애니메이션 도중에 뚝 끊기지 않도록 최소 이 시간만큼은 로딩 화면을 유지한다.
const MIN_LOADING_MS = GENERATING_STEPS.length * DEFAULT_STEP_INTERVAL_MS + 700;

const STEPS = [
  { key: 'basket', label: '담기' },
  { key: 'date', label: '날짜' },
  { key: 'priority', label: '우선순위' },
  { key: 'done', label: '완성' },
] as const;

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function formatShort(date: Date): string {
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

function formatDayDate(date: Date): string {
  return `${formatShort(date)} (${WEEKDAYS[date.getDay()]})`;
}

function formatDateRange(travelDate: string | null, duration: number | null): string | null {
  if (!travelDate) return null;
  const start = fromDateString(travelDate);
  if (!duration || duration <= 0) return formatShort(start);
  return `${formatShort(start)} - ${formatShort(addDays(start, duration))}`;
}

const ScreenContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: ${COLORS.gray50};
`;

const LoadingContainer = styled(View)`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const RetryButton = styled(TouchableOpacity)`
  margin-top: 16px;
  border-width: 1px;
  border-color: ${COLORS.coral500};
  border-radius: 8px;
  padding-vertical: 8px;
  padding-horizontal: 16px;
`;

const RetryLabel = styled(Text)`
  color: ${COLORS.coral500};
  font-size: 14px;
  font-family: ${FONT.medium};
`;

const Header = styled(View)`
  padding-top: 20px;
  padding-horizontal: 20px;
  padding-bottom: 12px;
`;

const StepperRow = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
`;

const StepBadge = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const StepCircle = styled(View)<{ $active: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 100px;
  align-items: center;
  justify-content: center;
  background-color: ${({ $active }) => ($active ? COLORS.coral500 : COLORS.success)};
`;

const StepLabel = styled(Text)<{ $active: boolean }>`
  font-size: 13px;
  font-family: ${({ $active }) => ($active ? FONT.bold : FONT.medium)};
  color: ${COLORS.gray900};
`;

const Subtitle = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 15px;
  color: ${COLORS.gray500};
  margin-top: 6px;
`;

const SummaryCard = styled(View)`
  background-color: ${COLORS.white};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  margin: 16px 20px 4px;
  padding: 14px 16px;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
`;

const SummaryItem = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 5px;
`;

const SummaryText = styled(Text)`
  font-size: 13px;
  font-family: ${FONT.semibold};
  color: ${COLORS.gray900};
`;

const SummaryDivider = styled(View)`
  width: 1px;
  height: 12px;
  background-color: ${COLORS.gray200};
`;

const GuestBanner = styled(View)`
  flex-direction: row;
  gap: 8px;
  background-color: ${COLORS.coral50};
  border-radius: 12px;
  margin: 12px 20px 4px;
  padding: 12px 14px;
`;

const GuestBannerText = styled(Text)`
  flex: 1;
  font-family: ${FONT.regular};
  font-size: 12px;
  line-height: 18px;
  color: ${COLORS.coral700};
`;

const DayHeaderRow = styled(View)`
  flex-direction: row;
  align-items: baseline;
  gap: 10px;
  margin: 20px 20px 12px;
`;

const DayBadge = styled(View)`
  background-color: ${COLORS.gray900};
  border-radius: 100px;
  padding-vertical: 4px;
  padding-horizontal: 12px;
`;

const DayBadgeLabel = styled(Text)`
  color: ${COLORS.white};
  font-size: 13px;
  font-family: ${FONT.bold};
`;

const DayMeta = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 13px;
  color: ${COLORS.gray500};
`;

const StopRow = styled(View)`
  flex-direction: row;
  gap: 14px;
  padding-horizontal: 20px;
  margin-bottom: 18px;
`;

const TimeColumn = styled(View)`
  align-items: center;
  width: 44px;
`;

const TimeText = styled(Text)`
  font-size: 13px;
  font-family: ${FONT.semibold};
  color: ${COLORS.gray700};
`;

const TimeDot = styled(View)`
  width: 7px;
  height: 7px;
  border-radius: 100px;
  background-color: ${COLORS.coral500};
  margin-top: 6px;
`;

const TimeConnector = styled(View)`
  flex: 1;
  width: 2px;
  background-color: ${COLORS.gray200};
  margin-top: 4px;
`;

const StopCard = styled(View)`
  flex: 1;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  border-radius: 12px;
  padding: 14px 16px;
  background-color: ${COLORS.white};
`;

const CategoryBadge = styled(View)<{ $color: string }>`
  flex-direction: row;
  align-items: center;
  gap: 3px;
  align-self: flex-start;
  background-color: ${({ $color }) => `${$color}1F`};
  border-radius: 100px;
  padding-vertical: 2px;
  padding-horizontal: 8px;
  margin-bottom: 6px;
`;

const CategoryLabel = styled(Text)<{ $color: string }>`
  font-size: 11px;
  font-family: ${FONT.semibold};
  color: ${({ $color }) => $color};
`;

const StopName = styled(Text)`
  font-size: 16px;
  font-family: ${FONT.semibold};
  color: ${COLORS.gray900};
`;

const StopAddress = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 12px;
  color: ${COLORS.gray500};
  margin-top: 2px;
`;

const ReasonBox = styled(View)`
  flex-direction: row;
  gap: 6px;
  background-color: ${COLORS.teal50};
  border-radius: 8px;
  padding: 8px 10px;
  margin-top: 10px;
`;

const ReasonText = styled(Text)`
  font-family: ${FONT.regular};
  flex: 1;
  font-size: 12px;
  color: ${COLORS.teal700};
  line-height: 17px;
`;

const ActionRow = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
`;

const ActionButton = styled(TouchableOpacity)`
  padding-vertical: 6px;
  padding-horizontal: 12px;
  border-radius: 8px;
  background-color: ${COLORS.gray100};
`;

const ActionLabel = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 13px;
  color: ${COLORS.gray700};
`;

const DeleteButton = styled(TouchableOpacity)`
  margin-left: auto;
  padding-vertical: 6px;
  padding-horizontal: 12px;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${COLORS.error};
`;

const DeleteLabel = styled(Text)`
  font-size: 13px;
  color: ${COLORS.error};
  font-family: ${FONT.medium};
`;

const AddButton = styled(TouchableOpacity)`
  margin-horizontal: 20px;
  margin-bottom: 16px;
  padding-vertical: 12px;
  border-radius: 10px;
  border-width: 1.5px;
  border-style: dashed;
  border-color: ${COLORS.coral500};
  background-color: ${COLORS.coral50};
  align-items: center;
`;

const AddButtonLabel = styled(Text)`
  font-size: 14px;
  color: ${COLORS.coral700};
  font-family: ${FONT.semibold};
`;

const CandidateRow = styled(TouchableOpacity)`
  background-color: ${COLORS.white};
  border-radius: 8px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  margin-horizontal: 20px;
  margin-bottom: 8px;
  padding: 10px 14px;
`;

const CandidateName = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 14px;
  color: ${COLORS.gray900};
`;

const StatsCard = styled(View)`
  flex-direction: row;
  background-color: ${COLORS.white};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  margin: 8px 20px 16px;
  padding: 16px 0;
`;

const StatItem = styled(View)`
  flex: 1;
  align-items: center;
  gap: 4px;
`;

const StatDivider = styled(View)`
  width: 1px;
  background-color: ${COLORS.gray200};
`;

const StatValue = styled(Text)`
  font-size: 16px;
  font-family: ${FONT.bold};
  color: ${COLORS.gray900};
`;

const StatLabel = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 11px;
  color: ${COLORS.gray500};
`;

const SaveButton = styled(TouchableOpacity)<{ $disabled: boolean }>`
  margin-horizontal: 20px;
  margin-top: 4px;
  margin-bottom: 12px;
  padding-vertical: 14px;
  border-radius: 12px;
  align-items: center;
  background-color: ${({ $disabled }) => ($disabled ? COLORS.gray200 : COLORS.coral500)};
`;

const SaveButtonLabel = styled(Text)`
  color: ${COLORS.white};
  font-size: 16px;
  font-family: ${FONT.medium};
`;

const ShareButton = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-horizontal: 20px;
  margin-bottom: 24px;
  padding-vertical: 14px;
  border-radius: 12px;
  background-color: ${COLORS.white};
  border-width: 1px;
  border-color: ${COLORS.gray200};
`;

const ShareButtonLabel = styled(Text)`
  color: ${COLORS.gray700};
  font-size: 16px;
  font-family: ${FONT.medium};
`;

export function ItineraryResultScreen({
  selectedRegions,
  selectedIds,
  priorities,
  travelDate,
  duration,
  companion,
  stylePrefs,
  initialStops,
  initialItineraryId,
  isGuest,
  onRequireLogin,
  onSaved,
  onGoHome,
}: ItineraryResultScreenProps) {
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>(
    initialStops ? 'done' : 'loading',
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [stops, setStops] = useState<ItineraryStop[]>(initialStops ?? []);
  const [plan, setPlan] = useState<{
    itineraryId: string | null;
    title: string;
    region: string;
    travelDate: string | null;
    duration: number | null;
  } | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showSaveModal, setShowSaveModal] = useState(false);

  const runGenerate = async () => {
    setStatus('loading');
    // 실제 생성이 아무리 빨리 끝나도, 진행 단계 체크리스트 애니메이션이 끝까지 재생될
    // 시간은 확보해준다(그래야 화면이 애니메이션 도중에 뚝 끊기지 않는다).
    const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS));
    try {
      if (isGuest) {
        // 백엔드 AI 일정 생성은 로그인이 필요하다. 게스트는 로그인 없이도 바로 일정을
        // 볼 수 있도록 프론트 규칙 기반 생성기를 대신 쓴다.
        const result = generateItinerary({ selectedIds, priorities });
        await minDelay;
        setStops(result.stops);
        setPlan({
          itineraryId: null,
          title: '나만의 여행 일정',
          region: selectedRegions[0] ?? '',
          travelDate,
          duration,
        });
      } else {
        const items = selectedIds.map((contentId) => ({
          contentId,
          priority: priorities[contentId] ?? 'good',
        }));
        const contentById = Object.fromEntries(selectedContents.map((c) => [c.id, c]));
        // 백엔드 /itineraries/generate는 요청 body를 받지 않고 서버에 저장된 바구니만
        // 읽으므로, 생성을 요청하기 전에 로컬 바구니를 서버로 먼저 동기화해야 한다.
        await syncBasketToServer({
          region: (selectedRegions[0] ?? '').toUpperCase(),
          travelDate,
          duration,
          companion,
          stylePrefs,
          items: items.map((item) => ({
            contentId: item.contentId,
            priority: item.priority,
            title: contentById[item.contentId]?.name ?? null,
            thumbnailUrl: contentById[item.contentId]?.imageUrl ?? null,
          })),
        });
        const generated = await generateItineraryPlan({
          region: selectedRegions[0] ?? '',
          travelDate,
          duration,
          companion,
          stylePrefs,
          items,
        });
        await minDelay;
        setStops(generated.stops);
        setPlan({
          itineraryId: generated.itineraryId,
          title: generated.title,
          region: generated.region,
          travelDate: generated.travelDate,
          duration: generated.duration,
        });
      }
      setStatus('done');
    } catch (error) {
      // 원인을 남기지 않으면 타임아웃인지 서버 에러인지 구분할 수 없다.
      console.warn('[itinerary] 일정 생성 실패', error);
      setErrorMessage('일정 생성에 실패했습니다. 컨텐츠를 추가하거나 다시 시도해주세요.');
      setStatus('error');
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: 마운트 시 1회만 생성 요청
  useEffect(() => {
    if (initialStops) return;
    runGenerate();
  }, []);

  const { contents: selectedContents } = useContentsByIds(selectedIds);
  const titleByContentId = useMemo(
    () => Object.fromEntries(selectedContents.map((c) => [c.id, c.name])),
    [selectedContents],
  );

  // 저장 버튼을 누르면 바로 저장하지 않고, 이름을 정할 수 있게 모달부터 띄운다.
  const handleSaveButtonPress = () => {
    if (isGuest) {
      onRequireLogin();
      return;
    }
    // days[].items는 서버에서 빈 배열을 거부한다(@NotEmpty). 모든 장소를 지운 채로
    // 저장하면 그대로 검증 실패로 이어지므로, 요청을 보내기 전에 미리 막는다.
    if (stops.length === 0) {
      Alert.alert('저장할 장소가 없어요', '일정에서 장소를 모두 지우면 저장할 수 없어요.');
      return;
    }
    setShowSaveModal(true);
  };

  // 실제 저장 요청. 성공하면 저장된 결과를, 실패하면 null을 돌려준다 — 호출부(그냥 저장 /
  // 저장하고 홈으로 가기)가 그 뒤에 뭘 할지는 각자 알아서 하게 분리했다.
  const submitSave = async (title: string) => {
    setSaveState('saving');
    try {
      const itineraryId = plan?.itineraryId ?? initialItineraryId;
      // plan은 AI가 새로 생성할 때만 채워진다. 저장된 일정을 다시 열어 편집하는 흐름은
      // runGenerate를 건너뛰어 plan이 계속 null이므로, 화면이 이미 갖고 있는
      // travelDate/duration prop을 fallback으로 써야 값이 비어 저장되지 않는다.
      const input = {
        title,
        region: plan?.region ?? selectedRegions[0] ?? '',
        travelDate: plan?.travelDate ?? travelDate,
        duration: plan?.duration ?? duration,
        stops,
        titleByContentId,
      };
      const saved = itineraryId
        ? await updateItineraryPlan(itineraryId, input)
        : await saveItineraryPlan(input);
      setPlan({
        itineraryId: saved.itineraryId,
        title: saved.title,
        region: saved.region,
        travelDate: saved.travelDate,
        duration: saved.duration,
      });
      if (saved.itineraryId) {
        onSaved?.({
          itineraryId: saved.itineraryId,
          title: saved.title,
          region: saved.region,
          travelDate: saved.travelDate,
          duration: saved.duration,
          savedAt: new Date().toISOString(),
        });
      }
      setSaveState('saved');
      return saved;
    } catch (error) {
      // 원인을 남기지 않으면 서버 응답인지 네트워크 문제인지 구분할 수 없다.
      console.warn('[itinerary] 일정 저장 실패', error);
      setSaveState('error');
      Alert.alert('저장 실패', toErrorMessage(error, '잠시 후 다시 시도해주세요.'));
      return null;
    }
  };

  const handleConfirmSave = async (title: string) => {
    const saved = await submitSave(title);
    // 모달은 성공했을 때만 닫는다 — 실패하면 열어둬서 이름 다시 안 치고 바로 재시도할 수 있게.
    if (saved) setShowSaveModal(false);
  };

  const handleConfirmSaveAndGoHome = async (title: string) => {
    const saved = await submitSave(title);
    if (saved) {
      setShowSaveModal(false);
      onGoHome();
    }
  };

  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isGuest) {
      onRequireLogin();
      return;
    }
    const itineraryId = plan?.itineraryId ?? initialItineraryId;
    if (!itineraryId) {
      Alert.alert('저장이 필요해요', '공유하려면 먼저 일정을 저장해주세요.');
      return;
    }
    setIsSharing(true);
    try {
      const link = await createShareLink(itineraryId);
      const text = `${buildShareText({ stops, contentById })}\n\n일정 보기: ${link}`;
      await shareItinerary(text);
    } catch (error) {
      // 원인을 남기지 않으면 서버 응답인지 네트워크 문제인지 구분할 수 없다.
      console.warn('[share] 공유 링크 생성 실패', { itineraryId, error });
      Alert.alert('공유 링크 생성 실패', toErrorMessage(error, '잠시 후 다시 시도해주세요.'));
    } finally {
      setIsSharing(false);
    }
  };

  const { contents: regionContents } = useContents(selectedRegions);
  const contentById = useMemo(() => {
    const map = Object.fromEntries(regionContents.map((c) => [c.id, c]));
    for (const content of selectedContents) map[content.id] = content;
    return map;
  }, [regionContents, selectedContents]);

  const usedIds = stops.map((s) => s.contentId);
  const candidates = regionContents.filter((c) => !usedIds.includes(c.id));

  if (status === 'loading') {
    return (
      <ScreenContainer>
        <LoadingContainer>
          <ProgressChecklist
            icon="sparkles"
            heading="일정을 만들고 있어요"
            subText={`${selectedIds.length}곳 맞춤 구성 중`}
            steps={GENERATING_STEPS}
            onDone={() => {}}
          />
        </LoadingContainer>
      </ScreenContainer>
    );
  }

  if (status === 'error') {
    return (
      <ScreenContainer>
        <LoadingContainer>
          <Subtitle style={{ textAlign: 'center', marginBottom: 4 }}>{errorMessage}</Subtitle>
          <RetryButton onPress={runGenerate} activeOpacity={0.8}>
            <RetryLabel>다시 시도</RetryLabel>
          </RetryButton>
        </LoadingContainer>
      </ScreenContainer>
    );
  }

  const planRegion = plan?.region ?? selectedRegions[0] ?? null;
  const planTravelDate = plan?.travelDate ?? travelDate;
  const planDuration = plan?.duration ?? duration;
  const regionName = REGIONS.find((r) => r.id === planRegion)?.name ?? null;
  const dateRange = formatDateRange(planTravelDate, planDuration);
  const totalDays =
    planDuration != null ? planDuration + 1 : Math.max(1, ...stops.map((s) => s.day));
  const dayList = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Header>
          <StepperRow>
            {STEPS.map((step, index) => {
              const active = index === STEPS.length - 1;
              return (
                <StepBadge key={step.key}>
                  <StepCircle $active={active}>
                    <Ionicons name="checkmark" size={12} color={COLORS.white} />
                  </StepCircle>
                  <StepLabel $active={active}>{step.label}</StepLabel>
                </StepBadge>
              );
            })}
          </StepperRow>
          <Subtitle>
            {planDuration != null
              ? `${planDuration}박 ${planDuration + 1}일 기준으로 ${isGuest ? '만들었어요' : 'AI가 만들었어요'}`
              : isGuest
                ? '나만의 일정이 완성됐어요'
                : 'AI가 나만의 일정을 만들었어요'}
          </Subtitle>
        </Header>

        {(regionName || dateRange) && (
          <SummaryCard>
            {regionName && (
              <SummaryItem>
                <Ionicons name="location-outline" size={13} color={COLORS.gray900} />
                <SummaryText>{regionName}</SummaryText>
              </SummaryItem>
            )}
            {dateRange && (
              <>
                {regionName && <SummaryDivider />}
                <SummaryItem>
                  <Ionicons name="calendar-outline" size={13} color={COLORS.gray900} />
                  <SummaryText>{dateRange}</SummaryText>
                </SummaryItem>
              </>
            )}
            <SummaryDivider />
            <SummaryText>총 {stops.length}곳</SummaryText>
          </SummaryCard>
        )}

        {isGuest && (
          <GuestBanner>
            <Ionicons name="sparkles" size={14} color={COLORS.coral700} />
            <GuestBannerText>
              지금 보시는 일정은 담아주신 콘텐츠를 기반으로 만든 예시입니다. 로그인하면 실제 AI 일정
              생성/저장 기능을 이용할 수 있어요.
            </GuestBannerText>
          </GuestBanner>
        )}

        {dayList.map((day) => {
          const dayStops = stops.filter((stop) => stop.day === day);
          const dayDate = planTravelDate ? addDays(fromDateString(planTravelDate), day - 1) : null;
          return (
            <View key={day}>
              <DayHeaderRow>
                <DayBadge>
                  <DayBadgeLabel>{day}일차</DayBadgeLabel>
                </DayBadge>
                <DayMeta>
                  {dayDate ? `${formatDayDate(dayDate)} · ` : ''}
                  {dayStops.length}곳
                </DayMeta>
              </DayHeaderRow>
              {dayStops.map((stop, index) => {
                const content = contentById[stop.contentId];
                const category = content && CATEGORIES.find((c) => c.id === content.category);
                const accentColor = category?.color ?? COLORS.gray500;
                return (
                  <StopRow key={stop.contentId}>
                    <TimeColumn>
                      <TimeText>{stop.startTime}</TimeText>
                      <TimeDot />
                      {index < dayStops.length - 1 && <TimeConnector />}
                    </TimeColumn>
                    <StopCard>
                      {category && (
                        <CategoryBadge $color={accentColor}>
                          <Ionicons name={category.icon} size={11} color={accentColor} />
                          <CategoryLabel $color={accentColor}>{category.label}</CategoryLabel>
                        </CategoryBadge>
                      )}
                      <StopName>{content?.name}</StopName>
                      {content?.address && (
                        <StopAddress numberOfLines={1}>{content.address}</StopAddress>
                      )}
                      <ReasonBox>
                        <Ionicons name="sparkles" size={13} color={COLORS.teal700} />
                        <ReasonText>{stop.reason}</ReasonText>
                      </ReasonBox>
                      <ActionRow>
                        <ActionButton
                          onPress={() => setStops((prev) => moveStop(prev, stop.contentId, 'up'))}
                        >
                          <ActionLabel>▲</ActionLabel>
                        </ActionButton>
                        <ActionButton
                          onPress={() => setStops((prev) => moveStop(prev, stop.contentId, 'down'))}
                        >
                          <ActionLabel>▼</ActionLabel>
                        </ActionButton>
                        <DeleteButton
                          onPress={() => setStops((prev) => removeStop(prev, stop.contentId))}
                        >
                          <DeleteLabel>삭제</DeleteLabel>
                        </DeleteButton>
                      </ActionRow>
                    </StopCard>
                  </StopRow>
                );
              })}
              <AddButton onPress={() => setExpandedDay((prev) => (prev === day ? null : day))}>
                <AddButtonLabel>+ 장소 추가</AddButtonLabel>
              </AddButton>
              {expandedDay === day &&
                candidates.map((candidate) => (
                  <CandidateRow
                    key={candidate.id}
                    onPress={() => {
                      setStops((prev) => addStop(prev, candidate.id, day));
                      setExpandedDay(null);
                    }}
                  >
                    <CandidateName>{candidate.name}</CandidateName>
                  </CandidateRow>
                ))}
            </View>
          );
        })}

        <StatsCard>
          <StatItem>
            <StatValue>{totalDays}일</StatValue>
            <StatLabel>기간</StatLabel>
          </StatItem>
          <StatDivider />
          <StatItem>
            <StatValue>{stops.length}곳</StatValue>
            <StatLabel>방문지</StatLabel>
          </StatItem>
          <StatDivider />
          <StatItem>
            <StatValue>{regionName ?? '-'}</StatValue>
            <StatLabel>지역</StatLabel>
          </StatItem>
        </StatsCard>
      </ScrollView>
      <SaveButton
        onPress={handleSaveButtonPress}
        activeOpacity={0.8}
        disabled={saveState === 'saving' || stops.length === 0}
        $disabled={stops.length === 0}
      >
        <SaveButtonLabel>
          {stops.length === 0
            ? '저장할 장소가 없어요'
            : saveState === 'saving'
              ? '저장 중...'
              : saveState === 'saved'
                ? '저장 완료'
                : saveState === 'error'
                  ? '저장 실패했습니다. 다시 시도해주세요.'
                  : isGuest
                    ? '로그인하고 일정 저장'
                    : '일정 저장'}
        </SaveButtonLabel>
      </SaveButton>
      <ShareButton onPress={handleShare} activeOpacity={0.8} disabled={isSharing}>
        {!isSharing && <Ionicons name="share-outline" size={16} color={COLORS.gray700} />}
        <ShareButtonLabel>
          {isSharing ? '공유 링크 만드는 중...' : isGuest ? '로그인하고 공유하기' : '공유하기'}
        </ShareButtonLabel>
      </ShareButton>
      <SaveItineraryModal
        visible={showSaveModal}
        initialTitle={plan?.title ?? '나만의 여행 일정'}
        isSaving={saveState === 'saving'}
        onConfirm={handleConfirmSave}
        onConfirmAndGoHome={handleConfirmSaveAndGoHome}
        onClose={() => setShowSaveModal(false)}
      />
    </ScreenContainer>
  );
}
