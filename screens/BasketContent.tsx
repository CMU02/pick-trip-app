import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import styled from 'styled-components';
import { ContentCard } from '../components/molecules/ContentCard';
import { ContentDetailModal } from '../components/molecules/ContentDetailModal';
import { COLORS } from '../constants/colors';
import { TAB_BAR_CLEARANCE, TAB_BAR_TOTAL } from '../constants/layout';
import { FONT } from '../constants/typography';
import { useContentsByIds } from '../hooks/useContentsByIds';
import type { Content } from '../types/content';
import type { TripDate } from '../types/trip';

interface BasketContentProps {
  selectedIds: string[];
  tripDate: TripDate | null;
  onToggle: (content: Content) => void;
  onCreateItinerary: () => void;
}

const Container = styled(View)`
  flex: 1;
  background-color: ${COLORS.gray50};
`;

const Header = styled(View)`
  padding-top: 24px;
  padding-horizontal: 20px;
  padding-bottom: 12px;
`;

const Title = styled(Text)`
  font-size: 24px;
  font-family: ${FONT.medium};
  color: ${COLORS.gray900};
`;

const Subtitle = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 15px;
  color: ${COLORS.gray500};
  margin-top: 6px;
`;

const CardList = styled(View)`
  gap: 12px;
`;

const EmptyText = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 15px;
  color: ${COLORS.gray500};
  text-align: center;
  margin-top: 60px;
`;

const RetryButton = styled(TouchableOpacity)`
  align-self: center;
  border-width: 1px;
  border-color: ${COLORS.coral500};
  border-radius: 8px;
  padding-vertical: 8px;
  padding-horizontal: 16px;
  margin-top: 12px;
`;

const RetryLabel = styled(Text)`
  color: ${COLORS.coral500};
  font-size: 14px;
  font-family: ${FONT.medium};
`;

// 흐름 최하단에 있으므로 아래 여백으로 플로팅 탭바를 피한다.
const BottomBar = styled(View)`
  padding-top: 12px;
  padding-horizontal: 20px;
  padding-bottom: 16px;
  margin-bottom: ${TAB_BAR_TOTAL}px;
  background-color: ${COLORS.white};
`;

const BasketCount = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 13px;
  color: ${COLORS.gray500};
  text-align: center;
  margin-bottom: 8px;
`;

const CTAButton = styled(TouchableOpacity)<{ $disabled: boolean }>`
  background-color: ${({ $disabled }) => ($disabled ? COLORS.gray200 : COLORS.coral500)};
  border-radius: 12px;
  padding-vertical: 14px;
  align-items: center;
`;

const CTALabel = styled(Text)`
  color: ${COLORS.white};
  font-size: 16px;
  font-family: ${FONT.medium};
`;

export function BasketContent({
  selectedIds,
  tripDate,
  onToggle,
  onCreateItinerary,
}: BasketContentProps) {
  const { contents: items, isLoading, isError, refetch } = useContentsByIds(selectedIds);
  const ready = selectedIds.length >= 2;
  const [detailContentId, setDetailContentId] = useState<string | null>(null);

  return (
    <Container>
      <Header>
        <Title>여행 바구니</Title>
        <Subtitle>담은 콘텐츠를 확인하고 일정을 만들어보세요</Subtitle>
      </Header>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 + TAB_BAR_CLEARANCE }}
      >
        <CardList>
          {isLoading ? (
            <ActivityIndicator color={COLORS.coral500} style={{ marginTop: 60 }} />
          ) : isError ? (
            <>
              <EmptyText>컨텐츠를 불러오지 못했습니다. 다시 시도해주세요.</EmptyText>
              <RetryButton onPress={() => refetch()} activeOpacity={0.8}>
                <RetryLabel>다시 시도</RetryLabel>
              </RetryButton>
            </>
          ) : items.length === 0 ? (
            <EmptyText>아직 담은 콘텐츠가 없어요</EmptyText>
          ) : (
            items.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                selected
                onPress={() => onToggle(content)}
                onPressDetail={() => setDetailContentId(content.id)}
              />
            ))
          )}
        </CardList>
      </ScrollView>
      <ContentDetailModal contentId={detailContentId} onClose={() => setDetailContentId(null)} />
      {items.length > 0 && (
        <BottomBar>
          <BasketCount>
            {selectedIds.length}개 담음
            {!ready && ' · 1개 더 담으면 일정 생성 가능'}
          </BasketCount>
          <CTAButton
            $disabled={!ready}
            disabled={!ready}
            onPress={() => {
              if (!tripDate) {
                Alert.alert(
                  '날짜를 선택해주세요',
                  '언제 떠나는지 알려주시면 일정을 만들 수 있어요.',
                );
                return;
              }
              onCreateItinerary();
            }}
            activeOpacity={ready ? 0.8 : 1}
          >
            <CTALabel>일정 만들기</CTALabel>
          </CTAButton>
        </BottomBar>
      )}
    </Container>
  );
}
