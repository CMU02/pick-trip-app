import type { TabKey } from '../components/molecules/TabBar';
import type { MainTabParamList } from '../types/navigation';

export const TAB_ROUTE_PAIRS: [keyof MainTabParamList, TabKey][] = [
  ['Home', 'home'],
  ['Explore', 'explore'],
  ['Basket', 'basket'],
  ['Profile', 'profile'],
];

export function routeNameToTabKey(routeName: keyof MainTabParamList): TabKey {
  return TAB_ROUTE_PAIRS.find(([route]) => route === routeName)?.[1] ?? 'home';
}

export function tabKeyToRouteName(key: TabKey): keyof MainTabParamList {
  return TAB_ROUTE_PAIRS.find(([, tabKey]) => tabKey === key)?.[0] ?? 'Home';
}
