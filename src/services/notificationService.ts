import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { appStorage } from '@/lib/storage/appStorage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') {
    appStorage.setPreferences({ notificationsEnabled: true });
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  const granted = status === 'granted';
  appStorage.setPreferences({ notificationsEnabled: granted });
  return granted;
}

async function scheduleBookmarkMilestone(count: number): Promise<void> {
  const prefs = appStorage.getPreferences();
  if (!prefs.notificationsEnabled) return;

  const idKey = `bookmark_milestone_${count}`;
  const existingId = appStorage.getNotificationId(idKey);
  if (existingId) return;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎉 Keep it up!',
      body: `You've bookmarked ${count} courses! Time to start learning?`,
      data: { type: 'bookmark_milestone', count },
    },
    trigger: null,
  });

  appStorage.setNotificationId(idKey, id);
}

async function scheduleInactivityReminder(): Promise<void> {
  const prefs = appStorage.getPreferences();
  if (!prefs.notificationsEnabled) return;

  const existingId = appStorage.getNotificationId('inactivity_reminder');
  if (existingId) {
    await Notifications.cancelScheduledNotificationAsync(existingId).catch(() => {});
  }

  if (Platform.OS === 'web') return;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '📚 Miss you!',
      body: 'Your courses miss you! Pick up where you left off.',
      data: { type: 'inactivity_reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 24 * 60 * 60,
      repeats: false,
    },
  });

  appStorage.setNotificationId('inactivity_reminder', id);
}

async function cancelInactivityReminder(): Promise<void> {
  const id = appStorage.getNotificationId('inactivity_reminder');
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  }
}

function handleNotificationResponse(
  response: Notifications.NotificationResponse,
  navigate: (path: string) => void
): void {
  const data = response.notification.request.content.data as Record<string, unknown>;
  const type = data['type'] as string | undefined;

  switch (type) {
    case 'bookmark_milestone':
      navigate('/(app)/(tabs)/bookmarks');
      break;
    case 'inactivity_reminder':
      navigate('/(app)/(tabs)/index');
      break;
    default:
      break;
  }
}

async function getPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export const notificationService = {
  requestPermissions,
  scheduleBookmarkMilestone,
  scheduleInactivityReminder,
  cancelInactivityReminder,
  handleNotificationResponse,
  getPermissionStatus,
} as const;
