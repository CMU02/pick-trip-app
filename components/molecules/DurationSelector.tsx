import { Text, TouchableOpacity, View } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import type { DurationType } from '../../types/trip';

interface DurationSelectorProps {
  selected: DurationType | null;
  customNights: number;
  onSelect: (type: DurationType) => void;
  onCustomNightsChange: (nights: number) => void;
}

const ChipRow = styled(View)`
  flex-direction: row;
  gap: 8px;
  flex-wrap: wrap;
`;

const Chip = styled(TouchableOpacity)<{ $active: boolean }>`
  padding-vertical: 8px;
  padding-horizontal: 16px;
  border-radius: 20px;
  background-color: ${({ $active }) => ($active ? COLORS.amber500 : COLORS.white)};
  border-width: 1px;
  border-color: ${({ $active }) => ($active ? COLORS.amber500 : COLORS.gray200)};
`;

const ChipLabel = styled(Text)<{ $active: boolean }>`
  font-size: 14px;
  color: ${({ $active }) => ($active ? COLORS.white : COLORS.gray700)};
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
`;

const CounterRow = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-top: 12px;
  gap: 16px;
`;

const CounterButton = styled(TouchableOpacity)`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  align-items: center;
  justify-content: center;
  background-color: ${COLORS.white};
`;

const CounterButtonLabel = styled(Text)`
  font-size: 18px;
  color: ${COLORS.gray700};
  line-height: 20px;
`;

const CounterLabel = styled(Text)`
  font-size: 15px;
  color: ${COLORS.gray900};
  font-weight: 500;
`;

const CHIPS: { type: DurationType; label: string }[] = [
  { type: 'day', label: '당일치기' },
  { type: '1night', label: '1박 2일' },
  { type: '2night', label: '2박 3일' },
  { type: 'custom', label: '커스텀' },
];

export function DurationSelector({
  selected,
  customNights,
  onSelect,
  onCustomNightsChange,
}: DurationSelectorProps) {
  return (
    <View>
      <ChipRow>
        {CHIPS.map(({ type, label }) => (
          <Chip
            key={type}
            $active={selected === type}
            onPress={() => onSelect(type)}
            activeOpacity={0.8}
          >
            <ChipLabel $active={selected === type}>{label}</ChipLabel>
          </Chip>
        ))}
      </ChipRow>
      {selected === 'custom' && (
        <CounterRow>
          <CounterButton
            onPress={() => onCustomNightsChange(Math.max(1, customNights - 1))}
            activeOpacity={0.7}
          >
            <CounterButtonLabel>−</CounterButtonLabel>
          </CounterButton>
          <CounterLabel>{customNights}박</CounterLabel>
          <CounterButton
            onPress={() => onCustomNightsChange(Math.min(30, customNights + 1))}
            activeOpacity={0.7}
          >
            <CounterButtonLabel>+</CounterButtonLabel>
          </CounterButton>
        </CounterRow>
      )}
    </View>
  );
}
