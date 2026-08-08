import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components';
import { PRIORITY_ACTIVE_COLORS, PriorityChips } from '../components/molecules/PriorityChips';
import { CATEGORIES } from '../constants/categories';
import { COLORS } from '../constants/colors';
import { REGIONS } from '../constants/regions';
import { useContentsByIds } from '../hooks/useContentsByIds';
import { PRIORITY_LABELS, PRIORITY_ORDER, type Priority } from '../types/priority';
import type { TripDate } from '../types/trip';

interface PrioritySelectScreenProps {
  selectedIds: string[];
  initialPriorities: Record<string, Priority>;
  selectedRegions: string[];
  tripDate: TripDate | null;
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
        ? COLORS.amber500
        : COLORS.gray200};
`;

const StepCircleLabel = styled(Text)<{ $variant: 'done' | 'active' | 'pending' }>`
  font-size: 11px;
  font-weight: 700;
  color: ${({ $variant }) => ($variant === 'pending' ? COLORS.gray500 : COLORS.white)};
`;

const StepLabel = styled(Text)<{ $variant: 'done' | 'active' | 'pending' }>`
  font-size: 13px;
  font-weight: ${({ $variant }) => ($variant === 'active' ? '700' : '500')};
  color: ${({ $variant }) => ($variant === 'pending' ? COLORS.gray400 : COLORS.gray900)};
`;

const Title = styled(Text)`
  font-size: 24px;
  font-weight: 500;
  color: ${COLORS.gray900};
`;

const Subtitle = styled(Text)`
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

const SummaryEmoji = styled(Text)`
  font-size: 13px;
`;

const SummaryText = styled(Text)`
  font-size: 13px;
  font-weight: 600;
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
  background-color: ${COLORS.amber50};
  border-radius: 12px;
  margin: 12px 20px 0;
  padding: 12px 14px;
`;

const InfoBannerEmoji = styled(Text)`
  font-size: 14px;
`;

const InfoBannerText = styled(Text)`
  flex: 1;
  font-size: 13px;
  color: ${COLORS.amber700};
  font-weight: 500;
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
  font-size: 12px;
  color: ${COLORS.gray500};
`;

const CTAButton = styled(TouchableOpacity)`
  background-color: ${COLORS.amber500};
  border-radius: 12px;
  padding-vertical: 14px;
  align-items: center;
`;

const CTALabel = styled(Text)`
  color: ${COLORS.white};
  font-size: 16px;
  font-weight: 500;
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

const ThumbnailEmoji = styled(Text)`
  font-size: 22px;
`;

const InfoColumn = styled(View)`
  flex: 1;
  gap: 8px;
`;

const ContentName = styled(Text)`
  font-size: 15px;
  font-weight: 600;
  color: ${COLORS.gray900};
`;

const ContentMeta = styled(Text)`
  font-size: 12px;
  color: ${COLORS.gray500};
  margin-top: 2px;
`;

export function PrioritySelectScreen({
  selectedIds,
  initialPriorities,
  selectedRegions,
  tripDate,
  onContinue,
}: PrioritySelectScreenProps) {
  const { contents: selectedContents, isLoading } = useContentsByIds(selectedIds);

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
                  <StepCircleLabel $variant={variant}>
                    {variant === 'done' ? '✓' : index + 1}
                  </StepCircleLabel>
                </StepCircle>
                <StepLabel $variant={variant}>{step.label}</StepLabel>
              </StepBadge>
            );
          })}
        </StepperRow>
        <Title>우선순위를 정해주세요</Title>
        <Subtitle>담은 콘텐츠별로 얼마나 가고 싶은지 알려주세요</Subtitle>
      </Header>

      {regionNames !== '' && (
        <SummaryCard>
          <SummaryItem>
            <SummaryEmoji>📍</SummaryEmoji>
            <SummaryText>{regionNames}</SummaryText>
          </SummaryItem>
          {dateRange && (
            <>
              <SummaryDivider />
              <SummaryItem>
                <SummaryEmoji>📅</SummaryEmoji>
                <SummaryText>{dateRange}</SummaryText>
              </SummaryItem>
            </>
          )}
          <SummaryDivider />
          <SummaryText>{selectedIds.length}곳 담음</SummaryText>
        </SummaryCard>
      )}

      <InfoBanner>
        <InfoBannerEmoji>💡</InfoBannerEmoji>
        <InfoBannerText>우선순위에 따라 AI가 일정 순서를 조율해줘요</InfoBannerText>
      </InfoBanner>

      {isLoading ? (
        <ActivityIndicator color={COLORS.amber500} style={{ marginTop: 60 }} />
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
                  <ThumbnailEmoji>{category?.emoji ?? '📍'}</ThumbnailEmoji>
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
        <CTAButton onPress={() => onContinue(priorities)} activeOpacity={0.8}>
          <CTALabel>{selectedIds.length}곳으로 일정 만들기</CTALabel>
        </CTAButton>
      </BottomBar>
    </ScreenContainer>
  );
}
