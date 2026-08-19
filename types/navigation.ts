// biome-ignore-all lint/style/useNamingConvention: react-navigation 화면 이름은 PascalCase 컨벤션을 따른다

export type RootStackParamList = {
  Auth: undefined;
  Login: undefined;
  Main: undefined;
  Priority: undefined;
  Itinerary: undefined;
  Shared: { token: string };
};

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Basket: undefined;
  Profile: undefined;
};
