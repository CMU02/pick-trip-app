import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';

interface FavoriteButtonProps {
  active: boolean;
  onPress: () => void;
  size?: number;
  diameter?: number;
}

// 이미지 썸네일 위에 겹쳐 놓을 걸 가정한 반투명 원형 배경 — 사진이 밝든 어둡든 아이콘이 잘 보인다.
const Circle = styled(TouchableOpacity)<{ $diameter: number }>`
  width: ${({ $diameter }) => $diameter}px;
  height: ${({ $diameter }) => $diameter}px;
  border-radius: 100px;
  background-color: rgba(0, 0, 0, 0.35);
  align-items: center;
  justify-content: center;
`;

export function FavoriteButton({ active, onPress, size = 18, diameter = 32 }: FavoriteButtonProps) {
  return (
    <Circle
      $diameter={diameter}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons
        name={active ? 'heart' : 'heart-outline'}
        size={size}
        color={active ? COLORS.coral500 : COLORS.white}
      />
    </Circle>
  );
}
