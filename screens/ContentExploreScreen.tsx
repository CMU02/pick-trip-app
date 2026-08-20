import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  type NativeScrollEvent,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import styled from 'styled-components';
import { CategoryFilter } from '../components/molecules/CategoryFilter';
import { ContentCard } from '../components/molecules/ContentCard';
import { ContentCardSkeleton } from '../components/molecules/ContentCardSkeleton';
import { ContentDetailModal } from '../components/molecules/ContentDetailModal';
import { COLORS } from '../constants/colors';
import { TAB_BAR_CLEARANCE, TAB_BAR_TOTAL } from '../constants/layout';
import { FONT } from '../constants/typography';
import { useContents } from '../hooks/useContents';
import type { Content, ContentCategory } from '../types/content';

interface ContentExploreScreenProps {
  selectedRegions: string[];
  selectedIds: string[];
  onToggle: (content: Content) => void;
  onContinue: (selectedIds: string[]) => void;
  favoriteIds: string[];
  onToggleFavorite: (content: Content) => void;
}

const ScreenContainer = styled(View)`
  flex: 1;
  background-color: ${COLORS.gray50};
`;

const Header = styled(View)`
  padding-top: 14px;
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

const SearchRow = styled(View)`
  padding-horizontal: 20px;
`;

const SearchBox = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  background-color: ${COLORS.white};
  border-width: 1px;
  border-color: ${COLORS.gray200};
  border-radius: 12px;
  padding-horizontal: 14px;
  height: 46px;
`;

const SearchInput = styled(TextInput).attrs({
  placeholderTextColor: COLORS.gray400,
})`
  flex: 1;
  font-family: ${FONT.regular};
  font-size: 14px;
  color: ${COLORS.gray900};
  padding: 0px;
`;

const ClearButton = styled(TouchableOpacity)`
  padding: 4px;
`;

const FilterRow = styled(View)`
  padding-vertical: 12px;
`;

const CardList = styled(View)`
  gap: 12px;
`;

const EmptyText = styled(Text)`
  font-family: ${FONT.regular};
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

// 플로팅 탭바 위로 올려 겹치지 않게 한다.
const BottomBar = styled(View)`
  position: absolute;
  bottom: ${TAB_BAR_TOTAL}px;
  left: 0;
  right: 0;
  padding-top: 12px;
  padding-horizontal: 20px;
  padding-bottom: 12px;
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

const FooterLoading = styled(View)`
  padding-vertical: 20px;
`;

function isCloseToBottom({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) {
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;
}

// 초기 로딩 시 보여줄 스켈레톤 카드 개수 (화면 한 번에 보이는 카드 수 정도)
const SKELETON_COUNT = 4;

export function ContentExploreScreen({
  selectedRegions,
  selectedIds,
  onToggle,
  onContinue,
  favoriteIds,
  onToggleFavorite,
}: ContentExploreScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailContentId, setDetailContentId] = useState<string | null>(null);

  const { contents, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useContents(selectedRegions);

  const filtered = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return contents.filter((c) => {
      const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
      const matchesKeyword =
        keyword === '' ||
        c.name.toLowerCase().includes(keyword) ||
        c.address.toLowerCase().includes(keyword);
      return matchesCategory && matchesKeyword;
    });
  }, [contents, selectedCategory, searchQuery]);

  return (
    <ScreenContainer>
      <Header>
        <Title>어떤 곳이 끌리나요?</Title>
        <Subtitle>마음에 드는 콘텐츠를 찾아보세요</Subtitle>
      </Header>
      <SearchRow>
        <SearchBox>
          <Ionicons name="search-outline" size={16} color={COLORS.gray400} />
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="장소 이름이나 주소로 검색"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <ClearButton onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Ionicons name="close" size={14} color={COLORS.gray400} />
            </ClearButton>
          )}
        </SearchBox>
      </SearchRow>
      <FilterRow>
        <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
      </FilterRow>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: selectedIds.length > 0 ? 120 + TAB_BAR_TOTAL : 40 + TAB_BAR_CLEARANCE,
        }}
        onScroll={({ nativeEvent }) => {
          if (hasNextPage && !isFetchingNextPage && isCloseToBottom(nativeEvent)) {
            fetchNextPage();
          }
        }}
        scrollEventThrottle={200}
      >
        <CardList>
          {isLoading ? (
            Array.from({ length: SKELETON_COUNT }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: 로딩 중 고정 개수의 자리표시자라 인덱스 키로 충분
              <ContentCardSkeleton key={i} />
            ))
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
                favorite={favoriteIds.includes(content.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))
          )}
        </CardList>
        {isFetchingNextPage && (
          <FooterLoading>
            <ActivityIndicator color={COLORS.coral500} />
          </FooterLoading>
        )}
      </ScrollView>
      <ContentDetailModal
        contentId={detailContentId}
        onClose={() => setDetailContentId(null)}
        favorite={detailContentId ? favoriteIds.includes(detailContentId) : false}
        onToggleFavorite={onToggleFavorite}
      />
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
