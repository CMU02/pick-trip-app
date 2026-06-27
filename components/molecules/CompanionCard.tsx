import { Text, TouchableOpacity } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import type { Companion } from '../../types/companion';

interface CompanionCardProps {
  companion: Companion;
  selected: boolean;
  onPress: () => void;
}

const Card = styled(TouchableOpacity)<{ $selected: boolean }>`
  flex: 1;
  border-radius: 12px;
  padding: 16px;
  min-height: 110px;
  border-width: 2px;
  border-color: ${({ $selected }) => ($selected ? COLORS.amber500 : COLORS.gray200)};
  background-color: ${({ $selected }) => ($selected ? COLORS.amber50 : COLORS.white)};
`;

const EmojiText = styled(Text)`
  font-size: 28px;
  margin-bottom: 8px;
`;

const CardLabel = styled(Text)<{ $selected: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${({ $selected }) => ($selected ? COLORS.amber700 : COLORS.gray900)};
  margin-bottom: 4px;
`;

const CardDescription = styled(Text)`
  font-size: 12px;
  color: ${COLORS.gray500};
  line-height: 16px;
`;

export function CompanionCard({ companion, selected, onPress }: CompanionCardProps) {
  return (
    <Card $selected={selected} onPress={onPress} activeOpacity={0.8}>
      <EmojiText>{companion.emoji}</EmojiText>
      <CardLabel $selected={selected}>{companion.label}</CardLabel>
      <CardDescription>{companion.description}</CardDescription>
    </Card>
  );
}
