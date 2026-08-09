import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { COMPANIONS } from '../constants/companions';
import { useBasket } from '../hooks/useBasket';
import { logout } from '../services/authService';
import { hasStoredSession } from '../services/authStorage';
import type { CompanionType, StylePreference } from '../types/companion';
import type { Content } from '../types/content';
import type { ItineraryStop } from '../types/itinerary';
import type { Priority } from '../types/priority';
import type { SavedItinerary } from '../types/savedItinerary';
import type { TripDate } from '../types/trip';
import { fromDateString, toDateString, toDurationType } from '../utils/tripDate';

export type { TripDate };

interface AppStateValue {
  isGuest: boolean;
  setIsGuest: (value: boolean) => void;
  isAuthLoading: boolean;
  selectedRegions: string[];
  setSelectedRegions: (value: string[]) => void;
  handleToggleRegion: (regionId: string) => void;
  tripDate: TripDate | null;
  setTripDate: (value: TripDate | null) => void;
  companion: CompanionType | null;
  setCompanion: (value: CompanionType | null) => void;
  companionLabel: string;
  stylePrefs: StylePreference[];
  setStylePrefs: (value: StylePreference[]) => void;
  handleToggleStylePref: (pref: StylePreference) => void;
  savedItinerary: SavedItinerary | null;
  setSavedItinerary: (value: SavedItinerary | null) => void;
  initialStops: ItineraryStop[] | undefined;
  setInitialStops: (value: ItineraryStop[] | undefined) => void;
  initialItineraryId: string | undefined;
  setInitialItineraryId: (value: string | undefined) => void;
  isBasketLoading: boolean;
  hasBasketItems: boolean;
  selectedIds: string[];
  priorities: Record<string, Priority>;
  itemIdByContentId: Record<string, string>;
  handleToggleContent: (content: Content) => Promise<void>;
  updateItemPriority: (itemId: string, priority: Priority) => Promise<void>;
  updateConditions: (input: {
    regionId: string | null;
    travelDate: string | null;
    duration: number | null;
    companion: CompanionType | null;
    stylePrefs: StylePreference[];
  }) => Promise<void>;
  resetSessionState: () => void;
  handleLogout: () => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  // 온보딩 없이 메인보드로 바로 진입하므로, 별도 로그인 전까지는 게스트 상태로 시작한다.
  // 단 SecureStore에 토큰이 남아 있으면 아래 useEffect가 로그인 상태로 되돌린다.
  const [isGuest, setIsGuest] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [tripDate, setTripDate] = useState<TripDate | null>(null);
  const [companion, setCompanion] = useState<CompanionType | null>(null);
  const [stylePrefs, setStylePrefs] = useState<StylePreference[]>([]);
  const [savedItinerary, setSavedItinerary] = useState<SavedItinerary | null>(null);
  const [initialStops, setInitialStops] = useState<ItineraryStop[] | undefined>(undefined);
  const [initialItineraryId, setInitialItineraryId] = useState<string | undefined>(undefined);

  // 앱을 다시 켰을 때 저장된 토큰으로 로그인 상태를 복원한다.
  // 이 확인이 끝나기 전에 화면을 그리면 게스트 UI가 잠깐 보였다 바뀌므로,
  // isAuthLoading을 진입 게이트(RootNavigator의 AuthGate)에서 기다린다.
  useEffect(() => {
    let cancelled = false;

    hasStoredSession()
      .then((restored) => {
        if (cancelled || !restored) return;
        setIsGuest(false);
      })
      .finally(() => {
        if (!cancelled) setIsAuthLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const {
    basket,
    isLoading: isBasketLoading,
    addItem,
    removeItem,
    updateItemPriority,
    updateConditions,
  } = useBasket();

  // 여행 조건(지역·날짜·동행·스타일)은 바구니와 같은 곳에 저장한다.
  // 바구니 로딩이 끝나면 1회만 화면 상태로 되돌린다.
  const hasRestoredConditions = useRef(false);

  useEffect(() => {
    if (isBasketLoading || !basket || hasRestoredConditions.current) return;
    hasRestoredConditions.current = true;

    const conditions = basket.conditions;
    if (conditions.region) setSelectedRegions([conditions.region]);
    setCompanion(conditions.companion);
    setStylePrefs(conditions.stylePrefs);
    if (conditions.travelDate) {
      const nights = conditions.duration ?? 0;
      setTripDate({
        startDate: fromDateString(conditions.travelDate),
        durationType: toDurationType(nights),
        nights,
      });
    }
  }, [isBasketLoading, basket]);

  // 조건이 바뀌면 저장한다. 복원 전에 쓰면 초기 빈 값이 저장된 값을 덮어쓰므로
  // 복원이 끝난 뒤부터만 쓴다.
  useEffect(() => {
    if (!hasRestoredConditions.current) return;
    updateConditions({
      regionId: selectedRegions[0] ?? null,
      travelDate: tripDate ? toDateString(tripDate.startDate) : null,
      duration: tripDate?.nights ?? null,
      companion,
      stylePrefs,
    });
  }, [selectedRegions, tripDate, companion, stylePrefs, updateConditions]);

  const basketItems = basket?.items ?? [];
  const selectedIds = basketItems.map((item) => item.contentId);
  const priorities = Object.fromEntries(basketItems.map((item) => [item.contentId, item.priority]));
  const itemIdByContentId = Object.fromEntries(
    basketItems.map((item) => [item.contentId, item.itemId]),
  );

  const handleToggleContent = async (content: Content) => {
    try {
      const existingItemId = itemIdByContentId[content.id];
      if (existingItemId) {
        await removeItem(existingItemId);
      } else {
        await addItem(content, 'good');
      }
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: unknown }).message)
          : String(error);
      Alert.alert('바구니 처리 실패', message);
    }
  };

  const handleToggleRegion = (regionId: string) => {
    setSelectedRegions((prev) =>
      prev.includes(regionId) ? prev.filter((id) => id !== regionId) : [...prev, regionId],
    );
  };

  const handleToggleStylePref = (pref: StylePreference) => {
    setStylePrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref],
    );
  };

  const resetSessionState = () => {
    // 로그아웃/세션 만료 시 인증 관련 상태만 초기화한다.
    // 지역·날짜·동행 같은 여행 취향은 로그인 여부와 무관하게 메인보드에 남아있어야 하므로 건드리지 않는다.
    setIsGuest(true);
    setInitialStops(undefined);
    setInitialItineraryId(undefined);
  };

  const handleLogout = () => {
    logout();
    resetSessionState();
  };

  const companionLabel = COMPANIONS.find((c) => c.id === companion)?.label ?? '가족';

  const value: AppStateValue = {
    isGuest,
    setIsGuest,
    isAuthLoading,
    selectedRegions,
    setSelectedRegions,
    handleToggleRegion,
    tripDate,
    setTripDate,
    companion,
    setCompanion,
    companionLabel,
    stylePrefs,
    setStylePrefs,
    handleToggleStylePref,
    savedItinerary,
    setSavedItinerary,
    initialStops,
    setInitialStops,
    initialItineraryId,
    setInitialItineraryId,
    isBasketLoading,
    hasBasketItems: basketItems.length > 0,
    selectedIds,
    priorities,
    itemIdByContentId,
    handleToggleContent,
    updateItemPriority,
    updateConditions,
    resetSessionState,
    handleLogout,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}
