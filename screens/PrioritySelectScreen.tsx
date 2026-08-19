import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components';
import { PriorityCardSkeleton } from '../components/molecules/PriorityCardSkeleton';
import { PRIORITY_ACTIVE_COLORS, PriorityChips } from '../components/molecules/PriorityChips';
import { TripDatePickerModal } from '../components/molecules/TripDatePickerModal';
import { CATEGORIES } from '../constants/categories';
import { COLORS } from '../constants/colors';
import { REGIONS } from '../constants/regions';
import { FONT } from '../constants/typography';
import { useContentsByIds } from '../hooks/useContentsByIds';
import { PRIORITY_LABELS, PRIORITY_ORDER, type Priority } from '../types/priority';
import type { TripDate } from '../types/trip';

interface PrioritySelectScreenProps {
  selectedIds: string[];
  initialPriorities: Record<string, Priority>;
  selectedRegions: string[];
  tripDate: TripDate | null;
  onChangeDate: (value: TripDate) => void;
  onContinue: (priorities: Record<string, Priority>) => void;
}

const STEPS = [
  { key: 'basket', label: '담기' },
  { key: 'date', label: '날짜' },
  { key: 'priority', label: '우선순위' },
  { key: 'done', label: '완성' },
] as const;

function formatDateRange(tripDate: TripDate | null): string | null {
  if (!tripDate) return null;
  const fmt = (d: Date) => `${d.getMonth() + 1}.${d.getDate()}`;
  if (tripDate.nights <= 0) return fmt(tripDate.startDate);
  const end = new Date(tripDate.startDate);
  end.setDate(end.getDate() + tripDate.nights);
  return `${fmt(tripDate.startDate)} - ${fmt(end)}`;
}

const ScreenContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: ${COLORS.gray50};
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

const StepCircle = styled(View)<{ $variant: 'done' | 'active' | 'pending' }>`
  width: 22px;
  height: 22px;
  border-radius: 100px;
  align-items: center;
  justify-content: center;
  background-color: ${({ $variant }) =>
    $variant === 'done'
      ? COLORS.success
      : $variant === 'active'
        ? COLORS.coral500
        : COLORS.gray200};
`;

const StepCircleLabel = styled(Text)<{ $variant: 'done' | 'active' | 'pending' }>`
  font-size: 11px;
  font-family: ${FONT.bold};
  color: ${({ $variant }) => ($variant === 'pending' ? COLORS.gray500 : COLORS.white)};
`;

const StepLabel = styled(Text)<{ $variant: 'done' | 'active' | 'pending' }>`
  font-size: 13px;
  font-family: ${({ $variant }) => ($variant === 'active' ? FONT.bold : FONT.medium)};
  color: ${({ $variant }) => ($variant === 'pending' ? COLORS.gray400 : COLORS.gray900)};
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
  margin: 16px 20px 0;
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

const InfoBanner = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  background-color: ${COLORS.coral50};
  border-radius: 12px;
  margin: 12px 20px 0;
  padding: 12px 14px;
`;

const InfoBannerText = styled(Text)`
  flex: 1;
  font-size: 13px;
  color: ${COLORS.coral700};
  font-family: ${FONT.medium};
`;

const BottomBar = styled(View)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding-top: 12px;
  padding-horizontal: 20px;
  padding-bottom: 28px;
  background-color: ${COLORS.white};
`;

const LegendRow = styled(View)`
  flex-direction: row;
  justify-content: center;
  gap: 18px;
  margin-bottom: 12px;
`;

const LegendItem = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const LegendDot = styled(View)<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 100px;
  background-color: ${({ $color }) => $color};
`;

const LegendLabel = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 12px;
  color: ${COLORS.gray500};
`;

const CTAButton = styled(TouchableOpacity)`
  background-color: ${COLORS.coral500};
  border-radius: 12px;
  padding-vertical: 14px;
  align-items: center;
`;

const CTALabel = styled(Text)`
  color: ${COLORS.white};
  font-size: 16px;
  font-family: ${FONT.medium};
`;

const Card = styled(View)`
  background-color: ${COLORS.white};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  margin-horizontal: 20px;
  padding: 14px 16px;
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

const ThumbnailBox = styled(View)<{ $color: string }>`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background-color: ${({ $color }) => `${$color}33`};
  align-items: center;
  justify-content: center;
`;

const InfoColumn = styled(View)`
  flex: 1;
  gap: 8px;
`;

const ContentName = styled(Text)`
  font-size: 15px;
  font-family: ${FONT.semibold};
  color: ${COLORS.gray900};
`;

const ContentMeta = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 12px;
  color: ${COLORS.gray500};
  margin-top: 2px;
`;

export function PrioritySelectScreen({
  selectedIds,
  initialPriorities,
  selectedRegions,
  tripDate,
  onChangeDate,
  onContinue,
}: PrioritySelectScreenProps) {
  const { contents: selectedContents, isLoading } = useContentsByIds(selectedIds);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [priorities, setPriorities] = useState<Record<string, Priority>>(() =>
    Object.fromEntries(selectedIds.map((id) => [id, initialPriorities[id] ?? 'good'])),
  );

  const handleChange = (id: string, priority: Priority) => {
    setPriorities((prev) => ({ ...prev, [id]: priority }));
  };

  const regionNames = REGIONS.filter((r) => selectedRegions.includes(r.id))
    .map((r) => r.name)
    .join(', ');
  const dateRange = formatDateRange(tripDate);
  const priorityCounts = PRIORITY_ORDER.reduce<Record<Priority, number>>(
    (acc, priority) => {
      acc[priority] = Object.values(priorities).filter((p) => p === priority).length;
      return acc;
    },
    { must: 0, good: 0, optional: 0 },
  );

  return (
    <ScreenContainer>
      <Header>
        <StepperRow>
          {STEPS.map((step, index) => {
            const variant = index < 2 ? 'done' : index === 2 ? 'active' : 'pending';
            return (
              <StepBadge key={step.key}>
                <StepCircle $variant={variant}>
                  {variant === 'done' ? (
                    <Ionicons name="checkmark" size={12} color={COLORS.white} />
                  ) : (
                    <StepCircleLabel $variant={variant}>{index + 1}</StepCircleLabel>
                  )}
                </StepCircle>
                <StepLabel $variant={variant}>{step.label}</StepLabel>
              </StepBadge>
            );
          })}
        </StepperRow>
        <Subtitle>담은 콘텐츠별로 얼마나 가고 싶은지 알려주세요</Subtitle>
      </Header>

      {regionNames !== '' && (
        <SummaryCard>
          <SummaryItem>
            <Ionicons name="location-outline" size={13} color={COLORS.gray900} />
            <SummaryText>{regionNames}</SummaryText>
          </SummaryItem>
          <SummaryDivider />
          {/* 날짜가 없어도 항상 탭 가능하게 해서, 탐색 화면에서 날짜 없이 바로 넘어온
              경우에도 이 화면에서 날짜를 고를 방법이 있게 한다. */}
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8 }}
          >
            <SummaryItem>
              <Ionicons
                name="calendar-outline"
                size={13}
                color={dateRange ? COLORS.gray900 : COLORS.coral500}
              />
              <SummaryText style={!dateRange && { color: COLORS.coral700 }}>
                {dateRange ?? '날짜를 선택해주세요'}
              </SummaryText>
              <Ionicons name="chevron-down-outline" size={12} color={COLORS.gray400} />
            </SummaryItem>
          </TouchableOpacity>
          <SummaryDivider />
          <SummaryText>{selectedIds.length}곳 담음</SummaryText>
        </SummaryCard>
      )}

      <InfoBanner>
        <Ionicons name="bulb-outline" size={16} color={COLORS.coral700} />
        <InfoBannerText>우선순위에 따라 AI가 일정 순서를 조율해줘요</InfoBannerText>
      </InfoBanner>

      {isLoading ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 140, gap: 12 }}
        >
          {Array.from({ length: Math.min(selectedIds.length, 6) || 1 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: 로딩 중 고정 개수의 자리표시자라 인덱스 키로 충분
            <PriorityCardSkeleton key={i} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 140, gap: 12 }}
        >
          {selectedContents.map((content) => {
            const category = CATEGORIES.find((c) => c.id === content.category);
            return (
              <Card key={content.id}>
                <ThumbnailBox $color={category?.color ?? COLORS.gray400}>
                  <Ionicons
                    name={category?.icon ?? 'location-outline'}
                    size={22}
                    color={COLORS.gray500}
                  />
                </ThumbnailBox>
                <InfoColumn>
                  <View>
                    <ContentName>{content.name}</ContentName>
                    <ContentMeta numberOfLines={1}>
                      {category?.label ?? content.category} · {content.address}
                    </ContentMeta>
                  </View>
                  <PriorityChips
                    value={priorities[content.id]}
                    onChange={(priority) => handleChange(content.id, priority)}
                  />
                </InfoColumn>
              </Card>
            );
          })}
        </ScrollView>
      )}

      <BottomBar>
        <LegendRow>
          {PRIORITY_ORDER.map((priority) => (
            <LegendItem key={priority}>
              <LegendDot $color={PRIORITY_ACTIVE_COLORS[priority].bg} />
              <LegendLabel>
                {PRIORITY_LABELS[priority]} {priorityCounts[priority]}
              </LegendLabel>
            </LegendItem>
          ))}
        </LegendRow>
        <CTAButton
          onPress={() => {
            if (!tripDate) {
              Alert.alert('날짜를 선택해주세요', '언제 떠나는지 알려주시면 일정을 만들 수 있어요.');
              setShowDatePicker(true);
              return;
            }
            onContinue(priorities);
          }}
          activeOpacity={0.8}
        >
          <CTALabel>{selectedIds.length}곳으로 일정 만들기</CTALabel>
        </CTAButton>
      </BottomBar>

      <TripDatePickerModal
        visible={showDatePicker}
        initialValue={tripDate}
        onConfirm={(value) => {
          onChangeDate(value);
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
      />
    </ScreenContainer>
  );
}
