import { NavigationContainer, type NavigationContainerRef } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { type RefObject, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStateProvider, useAppState } from './contexts/AppStateContext';
import { RootNavigator } from './navigation/RootNavigator';
import { setOnSessionExpired } from './services/apiClient';
import type { RootStackParamList } from './types/navigation';

const queryClient = new QueryClient();

const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      // biome-ignore lint/style/useNamingConvention: react-navigation 화면 이름은 PascalCase 컨벤션을 따른다
      Shared: 'share/:token',
    },
  },
};

type NavRef = RefObject<NavigationContainerRef<RootStackParamList> | null>;

function SessionExpiryHandler({ navigationRef }: { navigationRef: NavRef }) {
  const { resetSessionState } = useAppState();

  // biome-ignore lint/correctness/useExhaustiveDependencies: 마운트 시 1회만 콜백 등록
  useEffect(() => {
    setOnSessionExpired(() => {
      Alert.alert('로그인이 만료됐어요', '다시 로그인해주세요.');
      resetSessionState();
      navigationRef.current?.reset({ index: 0, routes: [{ name: 'Auth' }] });
    });
  }, []);

  return null;
}

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppStateProvider>
            <SessionExpiryHandler navigationRef={navigationRef} />
            <NavigationContainer ref={navigationRef} linking={linking}>
              <RootNavigator />
            </NavigationContainer>
          </AppStateProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
