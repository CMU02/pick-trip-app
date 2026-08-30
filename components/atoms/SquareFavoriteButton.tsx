import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';

interface SquareFavoriteButtonProps {
  active: boolean;
  onPress: () => void;
  size?: number;
  iconSize?: number;
}

// 콘텐츠 상세 화면 하단 바의 찜 버튼과 똑같은 모양(흰 배경 + 테두리 있는 사각형)을
// 다른 화면(콘텐츠 카드)에서도 그대로 쓸 수 있게 뺀 공용 컴포넌트. 사진 위에 올려도
// 잘 보이도록 반투명이 아니라 불투명 흰 배경을 쓴다.
const Box = styled(TouchableOpacity)<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 12px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  background-color: ${COLORS.white};
  align-items: center;
  justify-content: center;
`;

export function SquareFavoriteButton({
  active,
  onPress,
  size = 48,
  iconSize = 20,
}: SquareFavoriteButtonProps) {
  return (
    <Box
      $size={size}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons
        name={active ? 'heart' : 'heart-outline'}
        size={iconSize}
        color={active ? COLORS.coral500 : COLORS.gray700}
      />
    </Box>
  );
}
