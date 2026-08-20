import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../constants/colors';
import { FONT } from '../constants/typography';

const Container = styled(View)`
  flex: 1;
  background-color: ${COLORS.white};
  align-items: center;
  justify-content: center;
`;

const IconImage = styled(Image)`
  width: 96px;
  height: 96px;
  margin-bottom: 20px;
`;

const Wordmark = styled(Text)`
  font-size: 28px;
  font-family: ${FONT.bold};
`;

const WordmarkPick = styled(Text)`
  color: ${COLORS.gray900};
`;

const WordmarkTrip = styled(Text)`
  color: ${COLORS.coral500};
`;

const Tagline = styled(Text)`
  margin-top: 8px;
  font-size: 14px;
  font-family: ${FONT.regular};
  color: ${COLORS.gray500};
`;

const LoadingBar = styled(View)`
  position: absolute;
  bottom: 64px;
  width: 44px;
  height: 3px;
  border-radius: 2px;
  background-color: ${COLORS.coral500};
`;

// 앱을 처음 켤 때 로그인/바구니 복원이 끝날 때까지(RootNavigator.AuthGate) 보여주는
// 브랜드 스플래시 화면. 최소 노출 시간은 AuthGate가 별도로 보장한다.
export function SplashScreen() {
  const opacity = useRef(new Animated.Value(0)).current;

  // biome-ignore lint/correctness/useExhaustiveDependencies: 마운트 시 1회만 페이드인
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Container>
      <Animated.View style={{ opacity, alignItems: 'center' }}>
        <IconImage source={require('../assets/icon.png')} resizeMode="contain" />
        <Wordmark>
          <WordmarkPick>Pick</WordmarkPick>
          <WordmarkTrip>Trip</WordmarkTrip>
        </Wordmark>
        <Tagline>담고, 정하고, 떠나기</Tagline>
      </Animated.View>
      <LoadingBar />
    </Container>
  );
}
