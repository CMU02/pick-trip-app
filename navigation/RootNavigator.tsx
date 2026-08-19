import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { createStackNavigator } from '@react-navigation/stack';
import { useEffect } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { AuthScreen } from '../screens/AuthScreen';
import { ItineraryResultScreen } from '../screens/ItineraryResultScreen';
import { PrioritySelectScreen } from '../screens/PrioritySelectScreen';
import { ResumeItineraryScreen } from '../screens/ResumeItineraryScreen';
import { SharedItineraryScreen } from '../screens/SharedItineraryScreen';
import { loadItinerary } from '../services/itineraryStorage';
import type { RootStackParamList } from '../types/navigation';
import { toDateString } from '../utils/tripDate';
import { MainTabNavigator } from './MainTabNavigator';

const Stack = createStackNavigator<RootStackParamList>();

type Nav = StackNavigationProp<RootStackParamList>;

// 온보딩 단계 없이, 앱을 열면 바로 메인보드로 진입한다.
// 이전에 이어보던 일정이 있으면 그것만 먼저 물어보고, 없으면 곧장 메인으로 보낸다.
function AuthGate() {
  const navigation = useNavigation<Nav>();
  const { isAuthLoading, isBasketLoading, setSavedItinerary } = useAppState();

  // biome-ignore lint/correctness/useExhaustiveDependencies: 마운트 시 1회만 진입 경로를 결정한다
  useEffect(() => {
    // 로그인·여행 조건 복원이 끝나기 전에 메인으로 보내면
    // 게스트 UI와 빈 취향 칩이 잠깐 보였다 바뀐다. 복원은 AppStateProvider가 한다.
    if (isAuthLoading || isBasketLoading) return;

    loadItinerary().then((saved) => {
      if (saved) {
        setSavedItinerary(saved);
        navigation.reset({ index: 0, routes: [{ name: 'Resume' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }
    });
  }, [isAuthLoading, isBasketLoading]);

  return null;
}

function ResumeGate() {
  const navigation = useNavigation<Nav>();
  const { savedItinerary, setSelectedRegions, setInitialStops, setInitialItineraryId } =
    useAppState();

  if (!savedItinerary) return null;

  return (
    <ResumeItineraryScreen
      savedAt={savedItinerary.savedAt}
      onResume={() => {
        setSelectedRegions(savedItinerary.selectedRegions);
        setInitialStops(savedItinerary.stops);
        setInitialItineraryId(savedItinerary.itineraryId);
        navigation.navigate('Itinerary');
      }}
      onStartNew={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
    />
  );
}

function PriorityGate() {
  const navigation = useNavigation<Nav>();
  const {
    selectedIds,
    priorities,
    itemIdByContentId,
    updateItemPriority,
    selectedRegions,
    tripDate,
    setTripDate,
  } = useAppState();

  return (
    <PrioritySelectScreen
      selectedIds={selectedIds}
      initialPriorities={priorities}
      selectedRegions={selectedRegions}
      tripDate={tripDate}
      onChangeDate={setTripDate}
      onContinue={async (newPriorities) => {
        await Promise.all(
          Object.entries(newPriorities).map(([contentId, priority]) => {
            const itemId = itemIdByContentId[contentId];
            return itemId ? updateItemPriority(itemId, priority) : Promise.resolve();
          }),
        );
        navigation.navigate('Itinerary');
      }}
    />
  );
}

function ItineraryGate() {
  const navigation = useNavigation<Nav>();
  const {
    selectedRegions,
    selectedIds,
    priorities,
    tripDate,
    companion,
    stylePrefs,
    initialStops,
    initialItineraryId,
    isGuest,
  } = useAppState();

  return (
    <ItineraryResultScreen
      selectedRegions={selectedRegions}
      selectedIds={selectedIds}
      priorities={priorities}
      travelDate={tripDate ? toDateString(tripDate.startDate) : null}
      duration={tripDate?.nights ?? null}
      companion={companion}
      stylePrefs={stylePrefs}
      initialStops={initialStops}
      initialItineraryId={initialItineraryId}
      isGuest={isGuest}
      onRequireLogin={() => navigation.navigate('Login')}
    />
  );
}

function LoginGate() {
  const navigation = useNavigation<Nav>();
  const { setIsGuest } = useAppState();

  return (
    <AuthScreen
      onAuthed={() => {
        setIsGuest(false);
        navigation.goBack();
      }}
    />
  );
}

function SharedGate({ route }: { route: { params: RootStackParamList['Shared'] } }) {
  const navigation = useNavigation<Nav>();
  return <SharedItineraryScreen token={route.params.token} onClose={() => navigation.goBack()} />;
}

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthGate} />
      <Stack.Screen name="Login" component={LoginGate} />
      <Stack.Screen name="Resume" component={ResumeGate} />
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="Priority" component={PriorityGate} />
      <Stack.Screen name="Itinerary" component={ItineraryGate} />
      <Stack.Screen name="Shared" component={SharedGate} />
    </Stack.Navigator>
  );
}
