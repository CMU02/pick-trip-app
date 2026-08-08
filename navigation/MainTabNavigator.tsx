import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components';
import { TabBar, type TabKey } from '../components/molecules/TabBar';
import { COLORS } from '../constants/colors';
import { useAppState } from '../contexts/AppStateContext';
import { BasketContent } from '../screens/BasketContent';
import { ContentExploreScreen } from '../screens/ContentExploreScreen';
import { HomeContent } from '../screens/HomeContent';
import { ProfileContent } from '../screens/ProfileContent';
import type { MainTabParamList, RootStackParamList } from '../types/navigation';

const ScreenContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: ${COLORS.gray50};
`;

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ROUTE_PAIRS: [keyof MainTabParamList, TabKey][] = [
  ['Home', 'home'],
  ['Explore', 'explore'],
  ['Basket', 'basket'],
  ['Profile', 'profile'],
];

function routeNameToTabKey(routeName: keyof MainTabParamList): TabKey {
  return TAB_ROUTE_PAIRS.find(([route]) => route === routeName)?.[1] ?? 'home';
}

function tabKeyToRouteName(key: TabKey): keyof MainTabParamList {
  return TAB_ROUTE_PAIRS.find(([, tabKey]) => tabKey === key)?.[0] ?? 'Home';
}

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

function HomeTabScreen() {
  const {
    companionLabel,
    isGuest,
    selectedRegions,
    selectedIds,
    companion,
    tripDate,
    setCompanion,
    handleToggleRegion,
    setTripDate,
  } = useAppState();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList & MainTabParamList>>();

  return (
    <HomeContent
      companionLabel={companionLabel}
      isGuest={isGuest}
      selectedRegions={selectedRegions}
      selectedIds={selectedIds}
      companion={companion}
      tripDate={tripDate}
      onBrowse={() => navigation.navigate('Explore')}
      onOpenBasket={() => navigation.navigate('Basket')}
      onLogin={() => navigation.navigate('Login')}
      onChangeCompanion={setCompanion}
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
  } = useAppState();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <ProfileContent
      isGuest={isGuest}
      companion={companion}
      stylePrefs={stylePrefs}
      selectedRegions={selectedRegions}
      onChangeCompanion={setCompanion}
      onToggleStylePref={handleToggleStylePref}
      onToggleRegion={handleToggleRegion}
      onLogout={() => {
        handleLogout();
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }}
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
