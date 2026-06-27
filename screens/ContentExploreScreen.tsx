import { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import styled from 'styled-components';
import { CategoryFilter } from '../components/molecules/CategoryFilter';
import { ContentCard } from '../components/molecules/ContentCard';
import { COLORS } from '../constants/colors';
import { CONTENTS } from '../constants/contents';
import type { ContentCategory } from '../types/content';

interface ContentExploreScreenProps {
  selectedRegions: string[];
}

const ScreenContainer = styled(SafeAreaView)`
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

const SearchBox = styled(TextInput)`
  background-color: ${COLORS.white};
  border-width: 1px;
  border-color: ${COLORS.gray200};
  border-radius: 12px;
  padding-vertical: 12px;
  padding-horizontal: 16px;
  font-size: 15px;
  color: ${COLORS.gray900};
  margin-top: 14px;
`;

const FilterRow = styled(View)`
  padding-vertical: 12px;
`;

const CardList = styled(View)`
  gap: 12px;
  padding-bottom: 40px;
`;

const EmptyText = styled(Text)`
  font-size: 15px;
  color: ${COLORS.gray500};
  text-align: center;
  margin-top: 60px;
`;

export function ContentExploreScreen({ selectedRegions }: ContentExploreScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return CONTENTS.filter((c) => {
      const inRegion = selectedRegions.includes(c.regionId);
      const inCategory = selectedCategory === 'all' || c.category === selectedCategory;
      const inSearch = searchQuery.trim() === '' || c.name.includes(searchQuery.trim());
      return inRegion && inCategory && inSearch;
    });
  }, [selectedRegions, selectedCategory, searchQuery]);

  return (
    <ScreenContainer>
      <Header>
        <Title>어떤 곳이 끌리나요?</Title>
        <Subtitle>마음에 드는 콘텐츠를 찾아보세요</Subtitle>
        <SearchBox
          placeholder="장소 이름으로 검색"
          placeholderTextColor={COLORS.gray500}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </Header>
      <FilterRow>
        <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
      </FilterRow>
      <ScrollView showsVerticalScrollIndicator={false}>
        <CardList>
          {filtered.length === 0 ? (
            <EmptyText>조건에 맞는 콘텐츠가 없어요</EmptyText>
          ) : (
            filtered.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                onPress={() => console.log('selected:', content.id)}
              />
            ))
          )}
        </CardList>
      </ScrollView>
    </ScreenContainer>
  );
}
