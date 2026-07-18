import { ScrollView, Text, TouchableOpacity } from 'react-native';
import styled from 'styled-components';
import { CATEGORIES } from '../../constants/categories';
import { COLORS } from '../../constants/colors';
import type { ContentCategory } from '../../types/content';

interface CategoryFilterProps {
  selected: ContentCategory | 'all';
  onSelect: (id: ContentCategory | 'all') => void;
}

const Chip = styled(TouchableOpacity)<{ $active: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding-vertical: 7px;
  padding-horizontal: 14px;
  border-radius: 100px;
  border-width: 1px;
  background-color: ${({ $active }) => ($active ? COLORS.amber500 : COLORS.white)};
  border-color: ${({ $active }) => ($active ? COLORS.amber500 : COLORS.gray200)};
`;

const ChipEmoji = styled(Text)`
  font-size: 13px;
`;

const ChipLabel = styled(Text)<{ $active: boolean }>`
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  color: ${({ $active }) => ($active ? COLORS.white : COLORS.gray700)};
`;

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 4 }}
    >
      {CATEGORIES.map((cat) => (
        <Chip
          key={cat.id}
          $active={selected === cat.id}
          onPress={() => onSelect(cat.id as ContentCategory | 'all')}
          activeOpacity={0.8}
        >
          <ChipEmoji>{cat.emoji}</ChipEmoji>
          <ChipLabel $active={selected === cat.id}>{cat.label}</ChipLabel>
        </Chip>
      ))}
    </ScrollView>
  );
}
