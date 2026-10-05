import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components';
import { CategoryFilter } from '../components/molecules/CategoryFilter';
import { ContentCard } from '../components/molecules/ContentCard';
import { ContentCardSkeleton } from '../components/molecules/ContentCardSkeleton';
import { RegionFilter } from '../components/molecules/RegionFilter';
import { COLORS } from '../constants/colors';
import { TAB_BAR_CLEARANCE, TAB_BAR_TOTAL } from '../constants/layout';
import { REGIONS } from '../constants/regions';
import { FONT } from '../constants/typography';
import { useContents } from '../hooks/useContents';
import type { Content, ContentCategory } from '../types/content';

interface ContentExploreScreenProps {
  selectedRegions: string[];
  onToggleRegion: (regionId: string) => void;
  selectedIds: string[];
  onToggle: (content: Content) => void;
  onContinue: (selectedIds: string[]) => void;
  favoriteIds: string[];
  onToggleFavorite: (content: Content) => void;
  onPressDetail: (contentId: string) => void;
}

// top은 여기서 직접 처리한다 — MainTabNavigator의 공유 SafeAreaView는 홈 탭 코랄 헤더가
// 상태바 뒤까지 닿도록 top을 비워두기 때문.
const ScreenContainer = styled(SafeAreaView)`
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
  gap: 4px;
  padding-vertical: 12px;
`;

// 카드 사이 간격. 예전 CardList의 gap 12px을 FlatList 구분선으로 옮긴 것.
const CardSeparator = styled(View)`
  height: 12px;
`;

const SkeletonList = styled(View)`
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

// 초기 로딩 시 보여줄 스켈레톤 카드 개수 (화면 한 번에 보이는 카드 수 정도)
const SKELETON_COUNT = 4;

export function ContentExploreScreen({
  selectedRegions,
  onToggleRegion,
  selectedIds,
  onToggle,
  onContinue,
  favoriteIds,
  onToggleFavorite,
  onPressDetail,
}: ContentExploreScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory | 'all'>('all');
  const regionIds = REGIONS.map((r) => r.id);
  // 지역 칩은 홈의 "어디부터 둘러볼까요?" 카드, 프로필의 "선호 지역"과 같은 전역
  // selectedRegions를 그대로 쓴다 — 예전엔 이 화면만의 로컬 상태를 따로 뒀는데, 그러면
  // 탐색에서 지역을 2개 이상 고르고 홈으로 돌아가도 FOR YOU 추천이나 프로필의 선호 지역에
  // 반영이 안 됐고, 바구니도 안 비워졌다. 셋 다 같은 지역 개념을 공유하도록 여기서도
  // 전역 상태를 직접 읽고 쓴다(onToggleRegion은 handleToggleRegion과 동일 — 선택 시
  // 바구니가 비워지는 것도 홈/프로필과 동일하게 적용된다).
  //
  // 아직 아무 지역도 안 골랐으면(칩이 하나도 안 켜져 있으면) 제한이 없다는 뜻으로 보고
  // 전체를 보여준다 — 그래야 비어있는 목록으로 시작하지 않는다.
  const [searchQuery, setSearchQuery] = useState('');

  const { contents, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useContents(regionIds, { splitAcrossRegions: true });

  const filtered = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return contents.filter((c) => {
      const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
      const matchesRegion = selectedRegions.length === 0 || selectedRegions.includes(c.regionId);
      const matchesKeyword =
        keyword === '' ||
        c.name.toLowerCase().includes(keyword) ||
        c.address.toLowerCase().includes(keyword);
      return matchesCategory && matchesRegion && matchesKeyword;
    });
  }, [contents, selectedCategory, selectedRegions, searchQuery]);

  return (
    <ScreenContainer edges={['top']}>
      <Header>
        <Title>어떤 곳이 끌리나요?</Title>
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
        <RegionFilter
          regionIds={regionIds}
          selectedRegionIds={selectedRegions}
          onToggleRegion={onToggleRegion}
        />
        <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
      </FilterRow>
      {/* ScrollView + map은 받아온 카드를 전부 한 번에 그려, 페이지가 쌓일수록 느려졌다.
          FlatList는 화면 근처 카드만 그리고, 끝에 닿으면 다음 페이지를 자동으로 부른다. */}
      <FlatList
        data={isLoading || isError ? [] : filtered}
        keyExtractor={(content) => content.id}
        renderItem={({ item: content }) => (
          <ContentCard
            content={content}
            selected={selectedIds.includes(content.id)}
            onPress={() => onPressDetail(content.id)}
            onPressDetail={() => onPressDetail(content.id)}
            favorite={favoriteIds.includes(content.id)}
            onToggleFavorite={onToggleFavorite}
            onToggleBasket={onToggle}
            showRegion
          />
        )}
        ItemSeparatorComponent={CardSeparator}
        ListEmptyComponent={
          isLoading ? (
            <SkeletonList>
              {Array.from({ length: SKELETON_COUNT }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: 로딩 중 고정 개수의 자리표시자라 인덱스 키로 충분
                <ContentCardSkeleton key={i} />
              ))}
            </SkeletonList>
          ) : isError ? (
            <CenterBox>
              <EmptyText>컨텐츠를 불러오지 못했습니다. 다시 시도해주세요.</EmptyText>
              <RetryButton onPress={() => refetch()} activeOpacity={0.8}>
                <RetryLabel>다시 시도</RetryLabel>
              </RetryButton>
            </CenterBox>
          ) : (
            <CenterBox>
              <EmptyText>조건에 맞는 콘텐츠가 없어요</EmptyText>
            </CenterBox>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <FooterLoading>
              <ActivityIndicator color={COLORS.coral500} />
            </FooterLoading>
          ) : null
        }
        // 검색·필터로 받아온 페이지가 화면을 못 채워도 멈추지 않는다 — 다음 페이지를 부르는 동안
        // 하단 로딩 표시가 붙었다 빠지며 목록 길이가 바뀌어 onEndReached가 다시 불린다.
        // 다음 페이지가 실패하면(isError) 같은 이유로 실패 요청을 끝없이 반복하므로 막고,
        // 오류 화면의 "다시 시도"로 넘긴다.
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage && !isError) fetchNextPage();
        }}
        onEndReachedThreshold={0.6}
        initialNumToRender={6}
        windowSize={7}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: selectedIds.length > 0 ? 120 + TAB_BAR_TOTAL : 40 + TAB_BAR_CLEARANCE,
        }}
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
