import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pick-trip:trip-reminder-enabled';

export async function loadTripReminderEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw === 'true';
}

export async function saveTripReminderEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, String(enabled));
}
