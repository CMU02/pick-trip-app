import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components';
import { CategoryFilter } from '../components/molecules/CategoryFilter';
import { CATEGORIES } from '../constants/categories';
import { COLORS } from '../constants/colors';
import { FONT } from '../constants/typography';
import { useContents } from '../hooks/useContents';
import type { ContentCategory } from '../types/content';

interface AddPlaceScreenProps {
  regionIds: string[];
  excludeIds: string[];
  onSelect: (contentId: string) => void;
}

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${COLORS.white};
`;

const SearchBox = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin: 12px 20px 8px;
  padding: 10px 14px;
  border-radius: 12px;
  background-color: ${COLORS.gray50};
`;

const SearchInput = styled(TextInput)`
  flex: 1;
  font-family: ${FONT.regular};
  font-size: 14px;
  color: ${COLORS.gray900};
  padding: 0;
`;

// CategoryFilter는 가로 ScrollView라 flex 컬럼 안에 그대로 두면 남는 세로 공간을 FlatList와
// 나눠 가져 버린다 — View로 감싸 칩 높이만 차지하게 한다(ContentExploreScreen의 FilterRow와 같은 이유).
const FilterRow = styled(View)`
  padding-bottom: 8px;
`;

const Row = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
`;

const Thumb = styled(Image)`
  width: 56px;
  height: 56px;
  border-radius: 10px;
  background-color: ${COLORS.gray100};
`;

const RowText = styled(View)`
  flex: 1;
`;

const Name = styled(Text)`
  font-family: ${FONT.bold};
  font-size: 15px;
  color: ${COLORS.gray900};
`;

const Meta = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 12px;
  color: ${COLORS.gray500};
  margin-top: 3px;
`;

const Empty = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 14px;
  color: ${COLORS.gray500};
  text-align: center;
  margin-top: 60px;
`;

// 일정 화면의 "+ 장소 추가"가 여는 화면. 예전엔 일정 아래에 이름만 있는 긴 목록이
// 펼쳐졌는데, 지역 첫 페이지 20개뿐이고 검색·사진이 없어 고르기 어려웠다 — 검색·카테고리
// 필터·사진이 있는 별도 화면에서 끝까지 스크롤하며 고르게 한다.
export function AddPlaceScreen({ regionIds, excludeIds, onSelect }: AddPlaceScreenProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ContentCategory | 'all'>('all');
  const { contents, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useContents(regionIds);

  // ponytail: 검색은 지금까지 불러온 페이지 안에서만 거른다 — 서버 검색 API가 없어서.
  // 아직 안 불러온 장소는 목록 끝까지 스크롤해야 걸린다. 서버 검색이 생기면 그쪽으로 바꾼다.
  const candidates = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return contents.filter(
      (c) =>
        !excludeIds.includes(c.id) &&
        (category === 'all' || c.category === category) &&
        (keyword === '' ||
          c.name.toLowerCase().includes(keyword) ||
          c.address.toLowerCase().includes(keyword)),
    );
  }, [contents, excludeIds, category, query]);

  return (
    <Container edges={['bottom', 'left', 'right']}>
      <SearchBox>
        <Ionicons name="search-outline" size={16} color={COLORS.gray400} />
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder="장소 이름이나 주소로 검색"
          placeholderTextColor={COLORS.gray400}
          returnKeyType="search"
        />
      </SearchBox>
      <FilterRow>
        <CategoryFilter selected={category} onSelect={setCategory} />
      </FilterRow>
      <FlatList
        data={candidates}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <Row onPress={() => onSelect(item.id)} activeOpacity={0.7}>
            <Thumb source={item.imageUrl ? { uri: item.imageUrl } : undefined} />
            <RowText>
              <Name numberOfLines={1}>{item.name}</Name>
              <Meta numberOfLines={1}>
                {CATEGORIES.find((cat) => cat.id === item.category)?.label ?? item.category} ·{' '}
                {item.address}
              </Meta>
            </RowText>
            <Ionicons name="add-circle-outline" size={22} color={COLORS.coral500} />
          </Row>
        )}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={{ marginTop: 60 }} color={COLORS.coral500} />
          ) : (
            <Empty>추가할 수 있는 장소가 없어요</Empty>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator style={{ marginVertical: 16 }} color={COLORS.coral500} />
          ) : null
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.6}
        keyboardShouldPersistTaps="handled"
      />
    </Container>
  );
}
