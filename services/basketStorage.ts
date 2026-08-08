import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Basket } from '../types/basket';

const STORAGE_KEY = 'pick-trip:basket';

export const EMPTY_BASKET: Basket = {
  basketId: null,
  conditions: {
    region: null,
    travelDate: null,
    duration: null,
    companion: null,
    stylePrefs: [],
  },
  items: [],
};

export async function loadBasket(): Promise<Basket> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Basket) : EMPTY_BASKET;
}

export async function saveBasket(basket: Basket): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(basket));
}
