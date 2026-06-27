import { Text, View } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';

interface BadgeProps {
  label: string;
  color?: string;
  bg?: string;
}

const BadgeContainer = styled(View)<{ $bg: string }>`
  background-color: ${(p) => p.$bg};
  border-radius: 100px;
  padding-vertical: 2px;
  padding-horizontal: 8px;
`;

const BadgeLabel = styled(Text)<{ $color: string }>`
  color: ${(p) => p.$color};
  font-size: 12px;
  font-weight: 500;
`;

export function Badge({ label, color = COLORS.gray700, bg = COLORS.gray100 }: BadgeProps) {
  return (
    <BadgeContainer $bg={bg}>
      <BadgeLabel $color={color}>{label}</BadgeLabel>
    </BadgeContainer>
  );
}
