import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { RegionFilter } from '../components/molecules/RegionFilter';
import { COLORS } from '../constants/colors';
import { TAB_BAR_CLEARANCE, TAB_BAR_TOTAL } from '../constants/layout';
import { REGIONS } from '../constants/regions';
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
  onPressDetail: (contentId: string) => void;
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

const LoadMoreButton = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 8px;
  margin-horizontal: 20px;
  padding-vertical: 12px;
  border-radius: 12px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  background-color: ${COLORS.white};
`;

const LoadMoreLabel = styled(Text)`
  font-family: ${FONT.medium};
  font-size: 14px;
  color: ${COLORS.gray700};
`;

// 초기 로딩 시 보여줄 스켈레톤 카드 개수 (화면 한 번에 보이는 카드 수 정도)
const SKELETON_COUNT = 4;

export function ContentExploreScreen({
  selectedRegions,
  selectedIds,
  onToggle,
  onContinue,
  favoriteIds,
  onToggleFavorite,
  onPressDetail,
}: ContentExploreScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory | 'all'>('all');
  const regionIds = REGIONS.map((r) => r.id);
  // 지역 칩은 복수 선택(체크박스 방식) — "전체" 칩 없이 3개 지역 칩을 모두 선택하면 그 자체가
  // 전체 보기다. 홈에서 "선호 지역"을 일부만(1~2개) 골랐으면 그 지역들로 시작하고, 안
  // 골랐거나 전부 골랐으면 3개 지역 전부 선택된 상태로 시작한다. 탐색 화면 안에서는 칩으로
  // 지역을 자유롭게 바꿀 수 있어야 하므로, 콘텐츠 자체는(아래 useContents) 항상 3개 지역
  // 전부 불러온다 — 그래야 칩을 바꿔도 다시 불러오는 지연 없이 바로 걸러진다.
  const [selectedRegionIds, setSelectedRegionIds] = useState<string[]>(
    selectedRegions.length > 0 && selectedRegions.length < regionIds.length
      ? selectedRegions
      : regionIds,
  );
  // 위 useState 초기값은 이 화면이 "처음 만들어질 때" 딱 한 번만 반영된다. 탐색 탭은
  // react-navigation 탭 특성상 한 번 열리면 계속 마운트된 채로 남아있어서, 그 뒤 홈에서
  // "선호 지역"을 바꿔도 이 초기값은 안 따라간다. selectedRegions(prop)가 실제로 바뀔
  // 때만 다시 맞춰준다 — 매 렌더마다 도는 게 아니라 값이 바뀔 때만 돌도록 join한 키로 비교.
  const selectedRegionsKey = selectedRegions.join(',');
  const prevSelectedRegionsKey = useRef(selectedRegionsKey);
  // biome-ignore lint/correctness/useExhaustiveDependencies: regionIds/selectedRegions는 매 렌더 새 배열이라, 의존성에 넣으면 매번 돈다 — selectedRegionsKey로만 변화를 감지한다
  useEffect(() => {
    if (prevSelectedRegionsKey.current === selectedRegionsKey) return;
    prevSelectedRegionsKey.current = selectedRegionsKey;
    setSelectedRegionIds(
      selectedRegions.length > 0 && selectedRegions.length < regionIds.length
        ? selectedRegions
        : regionIds,
    );
  }, [selectedRegionsKey]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleToggleRegion = (id: string) => {
    setSelectedRegionIds((prev) => {
      if (!prev.includes(id)) return [...prev, id];
      // 최소 하나는 선택된 상태를 유지한다 — 다 해제하면 콘텐츠가 하나도 안 보이게 된다.
      if (prev.length === 1) return prev;
      return prev.filter((r) => r !== id);
    });
  };

  const { contents, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useContents(regionIds);

  const filtered = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return contents.filter((c) => {
      const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
      const matchesRegion = selectedRegionIds.includes(c.regionId);
      const matchesKeyword =
        keyword === '' ||
        c.name.toLowerCase().includes(keyword) ||
        c.address.toLowerCase().includes(keyword);
      return matchesCategory && matchesRegion && matchesKeyword;
    });
  }, [contents, selectedCategory, selectedRegionIds, searchQuery]);

  return (
    <ScreenContainer>
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
          selectedRegionIds={selectedRegionIds}
          onToggleRegion={handleToggleRegion}
        />
        <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
      </FilterRow>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: selectedIds.length > 0 ? 120 + TAB_BAR_TOTAL : 40 + TAB_BAR_CLEARANCE,
        }}
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
                onPress={() => onPressDetail(content.id)}
                onPressDetail={() => onPressDetail(content.id)}
                favorite={favoriteIds.includes(content.id)}
                onToggleFavorite={onToggleFavorite}
                onToggleBasket={onToggle}
                showRegion
              />
            ))
          )}
        </CardList>
        {isFetchingNextPage ? (
          <FooterLoading>
            <ActivityIndicator color={COLORS.coral500} />
          </FooterLoading>
        ) : (
          hasNextPage &&
          filtered.length > 0 && (
            <LoadMoreButton onPress={() => fetchNextPage()} activeOpacity={0.7}>
              <LoadMoreLabel>더보기</LoadMoreLabel>
              <Ionicons name="chevron-down-outline" size={14} color={COLORS.gray700} />
            </LoadMoreButton>
          )
        )}
      </ScrollView>
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
