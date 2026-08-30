import { Text, TouchableOpacity, View } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import { FONT } from '../../constants/typography';
import { PRIORITY_LABELS, PRIORITY_ORDER, type Priority } from '../../types/priority';

interface PriorityChipsProps {
  value: Priority;
  onChange: (priority: Priority) => void;
}

// 세 우선순위를 전부 앱 기본 코랄 한 계열로 통일했다 — "꼭 가기"는 진한 기본 코랄(coral500),
// "가면 좋음"·"시간 남으면"은 단계적으로 옅어지는 코랄(coral100 → coral50)로 우선순위가
// 낮아질수록 색이 옅어지는 게 한눈에 보이게 했다. 옅은 두 배경은 흰 글자로는 대비가 부족해서
// (WCAG AA 4.5:1 미달) coral700 진한 글자를 쓴다.
export const PRIORITY_ACTIVE_COLORS: Record<Priority, { bg: string; fg: string }> = {
  must: { bg: COLORS.coral500, fg: COLORS.white },
  good: { bg: COLORS.coral100, fg: COLORS.coral700 },
  optional: { bg: COLORS.coral50, fg: COLORS.coral700 },
};

const Row = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  gap: 8px;
`;

const Chip = styled(TouchableOpacity)<{ $active: boolean; $priority: Priority }>`
  padding-vertical: 8px;
  padding-horizontal: 10px;
  border-radius: 20px;
  align-items: center;
  background-color: ${({ $active, $priority }) =>
    $active ? PRIORITY_ACTIVE_COLORS[$priority].bg : COLORS.gray100};
`;

const ChipLabel = styled(Text)<{ $active: boolean; $priority: Priority }>`
  font-size: 13px;
  font-family: ${FONT.medium};
  color: ${({ $active, $priority }) =>
    $active ? PRIORITY_ACTIVE_COLORS[$priority].fg : COLORS.gray500};
`;

export function PriorityChips({ value, onChange }: PriorityChipsProps) {
  return (
    <Row>
      {PRIORITY_ORDER.map((priority) => (
        <Chip
          key={priority}
          $active={value === priority}
          $priority={priority}
          onPress={() => onChange(priority)}
          activeOpacity={0.8}
        >
          <ChipLabel $active={value === priority} $priority={priority}>
            {PRIORITY_LABELS[priority]}
          </ChipLabel>
        </Chip>
      ))}
    </Row>
  );
}
