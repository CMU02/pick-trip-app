import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  type NativeScrollEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import styled from 'styled-components';
import { CategoryFilter } from '../components/molecules/CategoryFilter';
import { ContentCard } from '../components/molecules/ContentCard';
import { ContentDetailModal } from '../components/molecules/ContentDetailModal';
import { COLORS } from '../constants/colors';
import { useContents } from '../hooks/useContents';
import type { Content, ContentCategory } from '../types/content';

interface ContentExploreScreenProps {
  selectedRegions: string[];
  selectedIds: string[];
  onToggle: (content: Content) => void;
  onContinue: (selectedIds: string[]) => void;
}

const ScreenContainer = styled(View)`
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
  font-weight: 500;
  color: ${COLORS.gray900};
`;

const Subtitle = styled(Text)`
  font-size: 15px;
  color: ${COLORS.gray500};
  margin-top: 6px;
`;

const FilterRow = styled(View)`
  padding-vertical: 12px;
`;

const CardList = styled(View)`
  gap: 12px;
`;

const EmptyText = styled(Text)`
  font-size: 15px;
  color: ${COLORS.gray500};
  text-align: center;
`;

const CenterBox = styled(View)`
  align-items: center;
  justify-content: center;
  margin-top: 60px;
  gap: 12px;
`;

const RetryButton = styled(TouchableOpacity)`
  border-width: 1px;
  border-color: ${COLORS.amber500};
  border-radius: 8px;
  padding-vertical: 8px;
  padding-horizontal: 16px;
`;

const RetryLabel = styled(Text)`
  color: ${COLORS.amber500};
  font-size: 14px;
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

const BasketCount = styled(Text)`
  font-size: 13px;
  color: ${COLORS.gray500};
  text-align: center;
  margin-bottom: 8px;
`;

const CTAButton = styled(TouchableOpacity)<{ $disabled: boolean }>`
  background-color: ${({ $disabled }) => ($disabled ? COLORS.gray200 : COLORS.amber500)};
  border-radius: 12px;
  padding-vertical: 14px;
  align-items: center;
`;

const CTALabel = styled(Text)`
  color: ${COLORS.white};
  font-size: 16px;
  font-weight: 500;
`;

const FooterLoading = styled(View)`
  padding-vertical: 20px;
`;

function isCloseToBottom({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) {
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;
}

export function ContentExploreScreen({
  selectedRegions,
  selectedIds,
  onToggle,
  onContinue,
}: ContentExploreScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory | 'all'>('all');
  const [detailContentId, setDetailContentId] = useState<string | null>(null);

  const { contents, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useContents(selectedRegions);

  const filtered = useMemo(() => {
    return contents.filter((c) => selectedCategory === 'all' || c.category === selectedCategory);
  }, [contents, selectedCategory]);

  return (
    <ScreenContainer>
      <Header>
        <Title>어떤 곳이 끌리나요?</Title>
        <Subtitle>마음에 드는 콘텐츠를 찾아보세요</Subtitle>
      </Header>
      <FilterRow>
        <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
      </FilterRow>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: selectedIds.length > 0 ? 120 : 40 }}
        onScroll={({ nativeEvent }) => {
          if (hasNextPage && !isFetchingNextPage && isCloseToBottom(nativeEvent)) {
            fetchNextPage();
          }
        }}
        scrollEventThrottle={200}
      >
        <CardList>
          {isLoading ? (
            <CenterBox>
              <ActivityIndicator color={COLORS.amber500} />
            </CenterBox>
          ) : isError ? (
            <CenterBox>
              <EmptyText>컨텐츠를 불러오지 못했습니다. 다시 시도해주세요.</EmptyText>
              <RetryButton onPress={() => refetch()} activeOpacity={0.8}>
                <RetryLabel>다시 시도</RetryLabel>
              </RetryButton>
            </CenterBox>
          ) : filtered.length === 0 ? (
            <CenterBox>
              <EmptyText>조건에 맞는 콘텐츠가 없어요</EmptyText>
            </CenterBox>
          ) : (
            filtered.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                selected={selectedIds.includes(content.id)}
                onPress={() => onToggle(content)}
                onPressDetail={() => setDetailContentId(content.id)}
              />
            ))
          )}
        </CardList>
        {isFetchingNextPage && (
          <FooterLoading>
            <ActivityIndicator color={COLORS.amber500} />
          </FooterLoading>
        )}
      </ScrollView>
      <ContentDetailModal contentId={detailContentId} onClose={() => setDetailContentId(null)} />
      {selectedIds.length > 0 && (
        <BottomBar>
          <BasketCount>{selectedIds.length}개 담음</BasketCount>
          <CTAButton
            $disabled={selectedIds.length < 2}
            onPress={() => {
              if (selectedIds.length >= 2) onContinue(selectedIds);
            }}
            activeOpacity={selectedIds.length >= 2 ? 0.8 : 1}
          >
            <CTALabel>
              {selectedIds.length < 2 ? '1개 더 담으면 일정 생성 가능' : '일정 만들기'}
            </CTALabel>
          </CTAButton>
        </BottomBar>
      )}
    </ScreenContainer>
  );
}
