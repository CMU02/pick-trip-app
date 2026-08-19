import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components';
import { TabBar } from '../components/molecules/TabBar';
import { COLORS } from '../constants/colors';
import { useAppState } from '../contexts/AppStateContext';
import { BasketContent } from '../screens/BasketContent';
import { ContentExploreScreen } from '../screens/ContentExploreScreen';
import { HomeContent } from '../screens/HomeContent';
import { ProfileContent } from '../screens/ProfileContent';
import { getItineraryPlan } from '../services/itineraryService';
import type { MainTabParamList, RootStackParamList } from '../types/navigation';
import { fromDateString, toDurationType } from '../utils/tripDate';
import { routeNameToTabKey, tabKeyToRouteName } from './tabRoutes';

const ScreenContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: ${COLORS.gray50};
`;

const Tab = createBottomTabNavigator<MainTabParamList>();

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { selectedIds } = useAppState();
  const activeRouteName = state.routes[state.index].name as keyof MainTabParamList;

  return (
    <TabBar
      active={routeNameToTabKey(activeRouteName)}
      onChange={(key) => navigation.navigate(tabKeyToRouteName(key))}
      basketCount={selectedIds.length}
    />
  );
}

// 저장된 일정 "목록" API는 없다(단건 조회만 존재, 웹팀 확인 완료 — services/itineraryHistoryStorage.ts
// 참고). 그래서 이 기기에서 저장했던 일정들을 히스토리로 쌓아두고, 그 중 하나를 골라 다시 열 때만
// 단건 조회(GET /itineraries/{id})로 최신 내용을 받아온다.
function useOpenSavedItinerary() {
  const {
    itineraryHistory,
    setSelectedRegions,
    setTripDate,
    setInitialStops,
    setInitialItineraryId,
    removeSavedItinerary,
  } = useAppState();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [openingItineraryId, setOpeningItineraryId] = useState<string | null>(null);

  const openItinerary = async (itineraryId: string) => {
    if (openingItineraryId) return;
    setOpeningItineraryId(itineraryId);
    try {
      const plan = await getItineraryPlan(itineraryId);
      // 저장 당시의 지역·날짜로 맞춰준다. 지금 고른 지역/날짜와 다를 수 있어서다.
      setSelectedRegions(plan.region ? [plan.region] : []);
      if (plan.travelDate) {
        const nights = plan.duration ?? 0;
        setTripDate({
          startDate: fromDateString(plan.travelDate),
          durationType: toDurationType(nights),
          nights,
        });
      }
      setInitialStops(plan.stops);
      setInitialItineraryId(plan.itineraryId ?? undefined);
      navigation.navigate('Itinerary');
    } catch (error) {
      // 원인을 남기지 않으면 네트워크 문제인지 서버 응답인지 구분할 수 없다.
      console.warn('[itinerary] 저장한 일정 불러오기 실패', error);
      Alert.alert('불러오기 실패', '저장한 일정을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setOpeningItineraryId(null);
    }
  };

  // 이 목록은 이 기기에만 있는 로컬 히스토리라, 여기서 지워도 서버에 저장된 일정 자체는
  // 남아있다(단건 삭제 API가 없어 지울 방법이 없음). "목록에서만 지워진다"는 걸 명확히
  // 하려고 확인 알림을 거친다.
  const deleteItinerary = (itineraryId: string, title: string) => {
    Alert.alert('일정을 지울까요?', `"${title}"을(를) 저장한 여행 목록에서 지웁니다.`, [
      { text: '취소', style: 'cancel' },
      { text: '지우기', style: 'destructive', onPress: () => removeSavedItinerary(itineraryId) },
    ]);
  };

  return { itineraryHistory, openingItineraryId, openItinerary, deleteItinerary };
}

function HomeTabScreen() {
  const {
    companionLabel,
    isGuest,
    selectedRegions,
    selectedIds,
    companion,
    stylePrefs,
    tripDate,
    setCompanion,
    handleToggleStylePref,
    handleToggleRegion,
    setTripDate,
  } = useAppState();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList & MainTabParamList>>();
  const { itineraryHistory, openingItineraryId, openItinerary, deleteItinerary } =
    useOpenSavedItinerary();

  return (
    <HomeContent
      companionLabel={companionLabel}
      isGuest={isGuest}
      selectedRegions={selectedRegions}
      selectedIds={selectedIds}
      companion={companion}
      stylePrefs={stylePrefs}
      tripDate={tripDate}
      itineraryHistory={itineraryHistory}
      openingItineraryId={openingItineraryId}
      onOpenItinerary={openItinerary}
      onDeleteItinerary={deleteItinerary}
      onBrowse={() => navigation.navigate('Explore')}
      onOpenBasket={() => navigation.navigate('Basket')}
      onLogin={() => navigation.navigate('Login')}
      onChangeCompanion={setCompanion}
      onToggleStylePref={handleToggleStylePref}
      onToggleRegion={handleToggleRegion}
      onSelectDate={setTripDate}
    />
  );
}

function ExploreTabScreen() {
  const { selectedRegions, selectedIds, handleToggleContent } = useAppState();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <ContentExploreScreen
      selectedRegions={selectedRegions}
      selectedIds={selectedIds}
      onToggle={handleToggleContent}
      onContinue={() => navigation.navigate('Priority')}
    />
  );
}

function BasketTabScreen() {
  const { selectedIds, tripDate, handleToggleContent } = useAppState();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <BasketContent
      selectedIds={selectedIds}
      tripDate={tripDate}
      onToggle={handleToggleContent}
      onCreateItinerary={() => navigation.navigate('Priority')}
    />
  );
}

function ProfileTabScreen() {
  const {
    isGuest,
    companion,
    stylePrefs,
    selectedRegions,
    setCompanion,
    handleToggleStylePref,
    handleToggleRegion,
    handleLogout,
    tripReminderEnabled,
    handleToggleTripReminder,
  } = useAppState();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { itineraryHistory, openingItineraryId, openItinerary, deleteItinerary } =
    useOpenSavedItinerary();

  return (
    <ProfileContent
      isGuest={isGuest}
      companion={companion}
      stylePrefs={stylePrefs}
      selectedRegions={selectedRegions}
      itineraryHistory={itineraryHistory}
      openingItineraryId={openingItineraryId}
      onOpenItinerary={openItinerary}
      onDeleteItinerary={deleteItinerary}
      onChangeCompanion={setCompanion}
      onToggleStylePref={handleToggleStylePref}
      onToggleRegion={handleToggleRegion}
      onLogout={() => {
        handleLogout();
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }}
      tripReminderEnabled={tripReminderEnabled}
      onToggleTripReminder={handleToggleTripReminder}
    />
  );
}

export function MainTabNavigator() {
  return (
    <ScreenContainer>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Home" component={HomeTabScreen} />
        <Tab.Screen name="Explore" component={ExploreTabScreen} />
        <Tab.Screen name="Basket" component={BasketTabScreen} />
        <Tab.Screen name="Profile" component={ProfileTabScreen} />
      </Tab.Navigator>
    </ScreenContainer>
  );
}
