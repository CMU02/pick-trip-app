import { useEffect } from 'react';
import type { DimensionValue, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';

interface SkeletonBoxProps {
  width?: DimensionValue;
  height: number;
  radius?: number;
  style?: ViewStyle;
}

const Box = styled(Animated.View)`
  background-color: ${COLORS.gray200};
`;

/**
 * 로딩 중임을 나타내는 스켈레톤 박스.
 * opacity를 반복적으로 오갔다 갔다 하는 pulse 애니메이션으로,
 * 너비를 측정할 필요 없이 어떤 크기(퍼센트 포함)에도 그대로 쓸 수 있다.
 */
export function SkeletonBox({ width = '100%', height, radius = 8, style }: SkeletonBoxProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Box style={[{ width, height, borderRadius: radius }, animatedStyle, style]} />;
}
