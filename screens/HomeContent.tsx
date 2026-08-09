import { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import styled from 'styled-components';
import {
  TripDatePickerModal,
  type TripDateValue,
} from '../components/molecules/TripDatePickerModal';
import { CATEGORIES } from '../constants/categories';
import { COLORS } from '../constants/colors';
import { COMPANIONS } from '../constants/companions';
import { TAB_BAR_CLEARANCE } from '../constants/layout';
import { REGIONS } from '../constants/regions';
import { useContents } from '../hooks/useContents';
import { useCurrentUser } from '../hooks/useCurrentUser';
import type { CompanionType } from '../types/companion';

interface HomeContentProps {
  companionLabel: string;
  isGuest: boolean;
  selectedRegions: string[];
  selectedIds: string[];
  companion: CompanionType | null;
  tripDate: TripDateValue | null;
  onBrowse: () => void;
  onOpenBasket: () => void;
  onLogin: () => void;
  onChangeCompanion: (companion: CompanionType) => void;
  onToggleRegion: (regionId: string) => void;
  onSelectDate: (value: TripDateValue) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatDate(date: Date): string {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;
}

const Scroll = styled(ScrollView)`
  flex: 1;
  background-color: ${COLORS.gray50};
`;

const HeaderSection = styled(View)`
  background-color: ${COLORS.coral500};
  padding: 16px 20px 48px;
  border-bottom-left-radius: 28px;
  border-bottom-right-radius: 28px;
`;

const LoginBar = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(255, 255, 255, 0.18);
  border-radius: 100px;
  padding: 6px 6px 6px 16px;
  margin-bottom: 20px;
`;

const LoginBarText = styled(Text)`
  font-size: 13px;
  font-weight: 500;
  color: ${COLORS.white};
`;

const LoginBarButton = styled(View)`
  background-color: ${COLORS.white};
  border-radius: 100px;
  padding-vertical: 6px;
  padding-horizontal: 14px;
`;

const LoginBarButtonLabel = styled(Text)`
  font-size: 12px;
  font-weight: 700;
  color: ${COLORS.coral600};
`;

const Greeting = styled(Text)`
  font-size: 22px;
  font-weight: 700;
  color: ${COLORS.white};
  letter-spacing: -0.3px;
  margin-bottom: 4px;
`;

const GreetingSub = styled(Text)`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
`;

// 하단 여백은 플로팅 탭바가 가리는 높이를 확보한다.
const Content = styled(View)`
  padding: 0 20px ${TAB_BAR_CLEARANCE}px;
`;

const StatusCard = styled(View)`
  background-color: ${COLORS.white};
  border-radius: 18px;
  padding: 18px;
  margin-top: -32px;
  margin-bottom: 16px;
  shadow-color: #000;
  shadow-opacity: 0.08;
  shadow-radius: 12px;
  shadow-offset: 0px 4px;
  elevation: 3;
`;

const StatusRow = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
`;

const StatusLabelRow = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const StatusIconBadge = styled(View)`
  width: 30px;
  height: 30px;
  border-radius: 100px;
  background-color: ${COLORS.coral50};
  align-items: center;
  justify-content: center;
`;

const StatusIconEmoji = styled(Text)`
  font-size: 15px;
`;

const StatusLabel = styled(Text)`
  font-size: 15px;
  font-weight: 600;
  color: ${COLORS.gray900};
`;

const StatusCount = styled(Text)`
  font-size: 14px;
  font-weight: 600;
  color: ${COLORS.coral600};
`;

const RegionBadgeRow = styled(View)`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
`;

const RegionBadge = styled(View)`
  background-color: ${COLORS.gray100};
  border-radius: 100px;
  padding-vertical: 4px;
  padding-horizontal: 10px;
`;

const RegionBadgeLabel = styled(Text)`
  font-size: 12px;
  color: ${COLORS.gray700};
`;

const DateRow = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: ${COLORS.gray50};
  border-radius: 12px;
  padding-vertical: 12px;
  padding-horizontal: 14px;
  margin-bottom: 16px;
`;

const DateRowLeft = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const DateRowEmoji = styled(Text)`
  font-size: 15px;
`;

const DateRowText = styled(Text)<{ $placeholder: boolean }>`
  font-size: 14px;
  color: ${({ $placeholder }) => ($placeholder ? COLORS.gray500 : COLORS.gray900)};
`;

const DateRowChevron = styled(Text)`
  font-size: 12px;
  color: ${COLORS.gray400};
`;

const PrimaryButton = styled(TouchableOpacity)`
  background-color: ${COLORS.coral500};
  border-radius: 10px;
  padding-vertical: 12px;
  align-items: center;
  flex-direction: row;
  justify-content: center;
  gap: 6px;
`;

const PrimaryButtonLabel = styled(Text)`
  color: ${COLORS.white};
  font-size: 14px;
  font-weight: 600;
`;

const SecondaryButton = styled(TouchableOpacity)`
  margin-top: 8px;
  border-radius: 10px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  padding-vertical: 12px;
  align-items: center;
`;

const SecondaryButtonLabel = styled(Text)`
  color: ${COLORS.gray700};
  font-size: 14px;
  font-weight: 600;
`;

const PrefCard = styled(View)`
  background-color: ${COLORS.white};
  border-radius: 18px;
  padding: 18px;
  margin-bottom: 24px;
`;

const PrefCardTitle = styled(Text)`
  font-size: 15px;
  font-weight: 700;
  color: ${COLORS.gray900};
  margin-bottom: 4px;
`;

const PrefCardDesc = styled(Text)`
  font-size: 12px;
  color: ${COLORS.gray500};
  margin-bottom: 14px;
`;

const FieldLabel = styled(Text)`
  font-size: 13px;
  font-weight: 600;
  color: ${COLORS.gray500};
  margin-bottom: 8px;
`;

const ChipRow = styled(View)<{ $last?: boolean }>`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: ${({ $last }) => ($last ? '0px' : '16px')};
`;

const Chip = styled(TouchableOpacity)<{ $active: boolean }>`
  padding-vertical: 8px;
  padding-horizontal: 14px;
  border-radius: 100px;
  border-width: 1px;
  background-color: ${({ $active }) => ($active ? COLORS.coral50 : COLORS.white)};
  border-color: ${({ $active }) => ($active ? COLORS.coral500 : COLORS.gray200)};
`;

const ChipLabel = styled(Text)<{ $active: boolean }>`
  font-size: 13px;
  font-weight: 500;
  color: ${({ $active }) => ($active ? COLORS.coral700 : COLORS.gray700)};
`;

const SectionHead = styled(View)`
  margin-bottom: 12px;
`;

const SectionEyebrow = styled(Text)`
  font-size: 11px;
  font-weight: 600;
  color: ${COLORS.coral600};
  letter-spacing: 0.5px;
  margin-bottom: 3px;
`;

const SectionTitle = styled(Text)`
  font-size: 17px;
  font-weight: 700;
  color: ${COLORS.gray900};
  letter-spacing: -0.2px;
`;

const RecommendRow = styled(ScrollView)``;

const RecommendCard = styled(View)`
  width: 150px;
  background-color: ${COLORS.white};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  overflow: hidden;
  margin-right: 12px;
`;

const RecommendThumb = styled(View)<{ $color: string }>`
  height: 80px;
  background-color: ${({ $color }) => `${$color}33`};
  align-items: center;
  justify-content: center;
`;

const RecommendImage = styled(Image)`
  height: 80px;
  width: 100%;
`;

const RecommendEmoji = styled(Text)`
  font-size: 26px;
`;

const RecommendBody = styled(View)`
  padding: 10px;
`;

const RecommendName = styled(Text)`
  font-size: 13px;
  font-weight: 600;
  color: ${COLORS.gray900};
`;

export function HomeContent({
  companionLabel,
  isGuest,
  selectedRegions,
  selectedIds,
  companion,
  tripDate,
  onBrowse,
  onOpenBasket,
  onLogin,
  onChangeCompanion,
  onToggleRegion,
  onSelectDate,
}: HomeContentProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const count = selectedIds.length;
  const regionNames = REGIONS.filter((r) => selectedRegions.includes(r.id)).map((r) => r.name);
  const { contents } = useContents(selectedRegions);
  const recommendations = contents.filter((c) => !selectedIds.includes(c.id)).slice(0, 6);
  const { user } = useCurrentUser(!isGuest);
  const displayName = isGuest ? companionLabel : (user?.nickname ?? companionLabel);

  return (
    <Scroll showsVerticalScrollIndicator={false}>
      <HeaderSection>
        {isGuest && (
          <LoginBar onPress={onLogin} activeOpacity={0.8}>
            <LoginBarText>로그인하고 맞춤 추천 받기</LoginBarText>
            <LoginBarButton>
              <LoginBarButtonLabel>로그인</LoginBarButtonLabel>
            </LoginBarButton>
          </LoginBar>
        )}
        <Greeting>안녕하세요, {displayName} 여행자님 👋</Greeting>
        <GreetingSub>
          {count > 0
            ? `여행 바구니에 ${count}곳을 담았어요.`
            : '마음에 드는 곳을 담고 AI 일정을 만들어보세요.'}
        </GreetingSub>
      </HeaderSection>

      <Content>
        <StatusCard>
          <StatusRow>
            <StatusLabelRow>
              <StatusIconBadge>
                <StatusIconEmoji>🧳</StatusIconEmoji>
              </StatusIconBadge>
              <StatusLabel>현재 여행 바구니</StatusLabel>
            </StatusLabelRow>
            <StatusCount>{count}곳</StatusCount>
          </StatusRow>
          {regionNames.length > 0 && (
            <RegionBadgeRow>
              {regionNames.map((name) => (
                <RegionBadge key={name}>
                  <RegionBadgeLabel>📍 {name}</RegionBadgeLabel>
                </RegionBadge>
              ))}
            </RegionBadgeRow>
          )}
          <DateRow onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
            <DateRowLeft>
              <DateRowEmoji>📅</DateRowEmoji>
              <DateRowText $placeholder={!tripDate}>
                {tripDate ? formatDate(tripDate.startDate) : '날짜를 선택해주세요'}
              </DateRowText>
            </DateRowLeft>
            <DateRowChevron>▼</DateRowChevron>
          </DateRow>
          {count > 0 ? (
            <>
              <PrimaryButton onPress={onOpenBasket} activeOpacity={0.8}>
                <PrimaryButtonLabel>바구니 확인하고 일정 만들기</PrimaryButtonLabel>
              </PrimaryButton>
              <SecondaryButton onPress={onBrowse} activeOpacity={0.8}>
                <SecondaryButtonLabel>콘텐츠 더 둘러보기</SecondaryButtonLabel>
              </SecondaryButton>
            </>
          ) : (
            <PrimaryButton onPress={onBrowse} activeOpacity={0.8}>
              <PrimaryButtonLabel>콘텐츠 둘러보기</PrimaryButtonLabel>
            </PrimaryButton>
          )}
        </StatusCard>

        <PrefCard>
          <PrefCardTitle>여행 취향</PrefCardTitle>
          <PrefCardDesc>온보딩에서 고른 취향이에요.</PrefCardDesc>

          <FieldLabel>👥 누구와 함께 가나요?</FieldLabel>
          <ChipRow>
            {COMPANIONS.map((c) => (
              <Chip
                key={c.id}
                $active={companion === c.id}
                onPress={() => onChangeCompanion(c.id)}
                activeOpacity={0.8}
              >
                <ChipLabel $active={companion === c.id}>{c.label}</ChipLabel>
              </Chip>
            ))}
          </ChipRow>

          <FieldLabel>📍 선호 지역</FieldLabel>
          <ChipRow $last>
            {REGIONS.map((region) => (
              <Chip
                key={region.id}
                $active={selectedRegions.includes(region.id)}
                onPress={() => onToggleRegion(region.id)}
                activeOpacity={0.8}
              >
                <ChipLabel $active={selectedRegions.includes(region.id)}>{region.name}</ChipLabel>
              </Chip>
            ))}
          </ChipRow>
        </PrefCard>

        {recommendations.length > 0 && (
          <View>
            <SectionHead>
              <SectionEyebrow>FOR YOU</SectionEyebrow>
              <SectionTitle>추천 콘텐츠</SectionTitle>
            </SectionHead>
            <RecommendRow horizontal showsHorizontalScrollIndicator={false}>
              {recommendations.map((item) => {
                const category = CATEGORIES.find((c) => c.id === item.category);
                return (
                  <RecommendCard key={item.id}>
                    {item.imageUrl ? (
                      <RecommendImage source={{ uri: item.imageUrl }} resizeMode="cover" />
                    ) : (
                      <RecommendThumb $color={category?.color ?? COLORS.gray400}>
                        <RecommendEmoji>{category?.emoji ?? '📍'}</RecommendEmoji>
                      </RecommendThumb>
                    )}
                    <RecommendBody>
                      <RecommendName numberOfLines={1}>{item.name}</RecommendName>
                    </RecommendBody>
                  </RecommendCard>
                );
              })}
            </RecommendRow>
          </View>
        )}
      </Content>

      <TripDatePickerModal
        visible={showDatePicker}
        initialValue={tripDate}
        onConfirm={(value) => {
          onSelectDate(value);
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
      />
    </Scroll>
  );
}
