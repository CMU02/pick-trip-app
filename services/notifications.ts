import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { fromDateString } from '../utils/tripDate';

// 여행 리마인더는 서버 이벤트가 필요 없는 순수 로컬 알림이다 — 앱이 이미 알고 있는
// 저장된 일정의 출발일(travelDate) 하루 전 오전 9시에 기기에서 직접 예약해둔다.
// 알림 하나당 itineraryId를 identifier로 써서, 같은 일정을 다시 저장하거나 토글을
// 껐다 켜도 중복 예약되지 않고 항상 최신 상태로 덮어써진다.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CHANNEL_ID = 'trip-reminder';

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: '여행 리마인더',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** 알림 권한을 요청한다. 이미 거부된 적이 있으면 OS 설정으로 유도해야 하므로 false를 돌려준다. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export interface TripReminderInput {
  itineraryId: string;
  title: string;
  region: string;
  travelDate: string | null; // yyyy-mm-dd
}

/**
 * 저장된 일정 하나에 대해 "출발 하루 전 오전 9시" 알림을 예약한다.
 * 이미 지난 시각(하루 전이 이미 지났거나 travelDate가 없음)이면 예약하지 않고,
 * 혹시 남아있던 예전 예약이 있으면 취소만 한다.
 */
export async function scheduleTripReminder(item: TripReminderInput): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(item.itineraryId).catch(() => {});

  if (!item.travelDate) return;
  const departure = fromDateString(item.travelDate);
  const reminderAt = new Date(departure);
  reminderAt.setDate(reminderAt.getDate() - 1);
  reminderAt.setHours(9, 0, 0, 0);

  if (reminderAt.getTime() <= Date.now()) return;

  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    identifier: item.itineraryId,
    content: {
      title: '내일 여행을 떠나요!',
      body: `${item.region} 여행 "${item.title}"이 내일 시작돼요. 준비물을 챙겨보세요.`,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderAt,
    },
  });
}

export async function cancelTripReminder(itineraryId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(itineraryId).catch(() => {});
}

export async function cancelAllTripReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
