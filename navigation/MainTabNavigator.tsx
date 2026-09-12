import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components';
import { ConfirmModal } from '../components/molecules/ConfirmModal';
import { TabBar } from '../components/molecules/TabBar';
import { COLORS } from '../constants/colors';
import { useAppState } from '../contexts/AppStateContext';
import { BasketContent } from '../screens/BasketContent';
import { ContentExploreScreen } from '../screens/ContentExploreScreen';
import { HomeContent } from '../screens/HomeContent';
import { ProfileContent } from '../screens/ProfileContent';
import type { MainTabParamList, RootStackParamList } from '../types/navigation';
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

// "저장한 여행" 목록(itineraryHistory)은 contexts/AppStateContext.tsx가 GET /itineraries로
// 받아온다. 목록에서 하나를 고르면 SavedItineraryScreen(RootNavigator의 SavedItineraryGate)으로
// 이동한다 — 단건 조회·수정(장소 추가·삭제·순서 변경)까지 그 화면 안에서 처리하므로
// 여기서는 그냥 화면 전환만 한다.
function useOpenSavedItinerary() {
  const { itineraryHistory, removeSavedItinerary } = useAppState();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const openItinerary = (itineraryId: string) => {
    navigation.navigate('SavedItinerary', { itineraryId });
  };

  // 이 목록은 이 기기에만 있는 로컬 히스토리라, 여기서 지워도 서버에 저장된 일정 자체는
  // 남아있다(단건 삭제 API가 없어 지울 방법이 없음). "목록에서만 지워진다"는 걸 명확히
  // 하려고 확인 모달을 거친다.
  const [pendingDelete, setPendingDelete] = useState<{ itineraryId: string; title: string } | null>(
    null,
  );

  const deleteItinerary = (itineraryId: string, title: string) => {
    setPendingDelete({ itineraryId, title });
  };

  const confirmDelete = () => {
    if (pendingDelete) removeSavedItinerary(pendingDelete.itineraryId);
    setPendingDelete(null);
  };

  const deleteModal = (
    <ConfirmModal
      visible={pendingDelete !== null}
      title="일정을 지울까요?"
      message={
        pendingDelete ? `"${pendingDelete.title}"을(를) 저장한 여행 목록에서 지웁니다.` : undefined
      }
      confirmLabel="지우기"
      destructive
      onConfirm={confirmDelete}
      onCancel={() => setPendingDelete(null)}
    />
  );

  // openingItineraryId는 이제 항상 null이다 — 예전엔 단건 조회가 끝날 때까지 카드에 로딩
  // 스피너를 보여줬는데, 지금은 화면 전환이 즉시 일어나고 조회는 새 화면에서 하기 때문에
  // 더 이상 기다릴 일이 없다. HomeContent/ProfileContent의 prop 형태만 그대로 맞춰준다.
  return {
    itineraryHistory,
    openingItineraryId: null,
    openItinerary,
    deleteItinerary,
    deleteModal,
  };
}

function HomeTabScreen() {
  const {
    isGuest,
    selectedRegions,
    selectedIds,
    tripDate,
    setTripDate,
    favoriteIds,
    handleToggleFavorite,
    recentlyViewedIds,
    handleToggleContent,
    handleSelectRegion,
  } = useAppState();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList & MainTabParamList>>();
  const { itineraryHistory, openingItineraryId, openItinerary, deleteItinerary, deleteModal } =
    useOpenSavedItinerary();

  // 홈 탭은 상단이 코랄색으로 상태바 아래까지 꽉 차 있어서, 이 탭에 있는 동안만 상태바
  // 아이콘을 밝은색으로 바꾼다. 다른 탭으로 이동하면(blur) App.tsx의 기본값(dark)으로 되돌린다.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );

  return (
    <>
      <HomeContent
        isGuest={isGuest}
        selectedRegions={selectedRegions}
        selectedIds={selectedIds}
        tripDate={tripDate}
        itineraryHistory={itineraryHistory}
        openingItineraryId={openingItineraryId}
        onOpenItinerary={openItinerary}
        onDeleteItinerary={deleteItinerary}
        onBrowse={() => navigation.navigate('Explore')}
        onOpenBasket={() => navigation.navigate('Basket')}
        onLogin={() => navigation.navigate('Login')}
        onSelectDate={setTripDate}
        favoriteIds={favoriteIds}
        onToggleFavorite={handleToggleFavorite}
        onOpenFavorites={() => navigation.navigate('Favorites')}
        onPressDetail={(contentId) => navigation.navigate('ContentDetail', { contentId })}
        onToggle={handleToggleContent}
        recentlyViewedIds={recentlyViewedIds}
        onSelectRegion={handleSelectRegion}
      />
      {deleteModal}
    </>
  );
}

function ExploreTabScreen() {
  const { selectedRegions, selectedIds, handleToggleContent, favoriteIds, handleToggleFavorite } =
    useAppState();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <ContentExploreScreen
      selectedRegions={selectedRegions}
      selectedIds={selectedIds}
      onToggle={handleToggleContent}
      onContinue={() => navigation.navigate('Priority')}
      favoriteIds={favoriteIds}
      onToggleFavorite={handleToggleFavorite}
      onPressDetail={(contentId) => navigation.navigate('ContentDetail', { contentId })}
    />
  );
}

function BasketTabScreen() {
  const { selectedIds, tripDate, handleToggleContent, favoriteIds, handleToggleFavorite } =
    useAppState();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <BasketContent
      selectedIds={selectedIds}
      tripDate={tripDate}
      onToggle={handleToggleContent}
      onCreateItinerary={() => navigation.navigate('Priority')}
      favoriteIds={favoriteIds}
      onToggleFavorite={handleToggleFavorite}
      onPressDetail={(contentId) => navigation.navigate('ContentDetail', { contentId })}
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
    favoriteIds,
    handleToggleFavorite,
    handleLogout,
    tripReminderEnabled,
    handleToggleTripReminder,
  } = useAppState();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { itineraryHistory, openingItineraryId, openItinerary, deleteItinerary, deleteModal } =
    useOpenSavedItinerary();

  return (
    <>
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
        favoriteIds={favoriteIds}
        onToggleFavorite={handleToggleFavorite}
        onOpenFavorites={() => navigation.navigate('Favorites')}
        onPressContent={(contentId) => navigation.navigate('ContentDetail', { contentId })}
        onLogin={() => navigation.navigate('Login')}
        onLogout={() => {
          handleLogout();
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        }}
        onOpenAccountManagement={() => navigation.navigate('AccountManagement')}
        tripReminderEnabled={tripReminderEnabled}
        onToggleTripReminder={handleToggleTripReminder}
        onOpenTerms={() => navigation.navigate('Terms')}
        onOpenPrivacy={() => navigation.navigate('Privacy')}
      />
      {deleteModal}
    </>
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
