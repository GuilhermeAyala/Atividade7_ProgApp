import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';

export type Recurrence = 'once' | 'daily' | 'weekly';

export type Reminder = {
  id: string;
  title: string;
  description: string;
  time: string;
  recurrence: Recurrence;
  enabled: boolean;
  done: boolean;
  notificationId?: string;
  snoozeNotificationId?: string;
};

export const REMINDER_CATEGORY = 'reminder_actions';
export const DONE_ACTION = 'done_reminder';
export const SNOOZE_ACTION = 'snooze_reminder';
const CHANNEL_ID = 'reminders';
const webTimers = new Map<string, ReturnType<typeof setTimeout>>();

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function timeParts(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

function webNotificationsAvailable() {
  return Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window;
}

function nextWebDate(reminder: Reminder) {
  const { hour, minute } = timeParts(reminder.time);
  const now = new Date();
  const date = new Date(now);
  date.setHours(hour, minute, 0, 0);

  if (reminder.recurrence === 'weekly') {
    const targetDay = now.getDay();
    let daysUntil = (targetDay - now.getDay() + 7) % 7;
    if (daysUntil === 0 && date.getTime() <= now.getTime()) daysUntil = 7;
    date.setDate(date.getDate() + daysUntil);
  } else if (date.getTime() <= now.getTime()) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

function scheduleWebNotification(reminder: Reminder, delay: number, repeats: boolean) {
  if (!webNotificationsAvailable() || window.Notification.permission !== 'granted') return undefined;
  const notificationId = `web-${reminder.id}-${Date.now()}`;
  const timer = setTimeout(() => {
    const notification = new window.Notification(reminder.title, {
      body: reminder.description || 'Hora do seu lembrete.',
      tag: reminder.id,
    });
    notification.onclick = () => window.focus();
    webTimers.delete(notificationId);
    if (repeats) scheduleWebReminder(reminder);
  }, Math.max(delay, 1000));
  webTimers.set(notificationId, timer);
  return notificationId;
}

function scheduleWebReminder(reminder: Reminder) {
  const date = nextWebDate(reminder);
  return scheduleWebNotification(reminder, date.getTime() - Date.now(), reminder.recurrence !== 'once');
}

export async function configureNotifications() {
  if (Platform.OS === 'web') {
    if (!webNotificationsAvailable()) return false;
    if (window.Notification.permission === 'default') {
      return (await window.Notification.requestPermission()) === 'granted';
    }
    return window.Notification.permission === 'granted';
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Lembretes',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 120, 180],
    });
  }

  await Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY, [
    { identifier: DONE_ACTION, buttonTitle: 'Concluir' },
    { identifier: SNOOZE_ACTION, buttonTitle: 'Adiar 10 min' },
  ]);

  const current = await Notifications.getPermissionsAsync();
  const result = current.status === 'granted' ? current : await Notifications.requestPermissionsAsync();
  return result.status === 'granted';
}

export async function cancelNotification(notificationId?: string) {
  if (!notificationId) return;
  if (Platform.OS === 'web') {
    const timer = webTimers.get(notificationId);
    if (timer) clearTimeout(timer);
    webTimers.delete(notificationId);
    return;
  }
  await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => undefined);
}

export async function scheduleReminder(reminder: Reminder) {
  if (Platform.OS === 'web') return scheduleWebReminder(reminder);
  const { hour, minute } = timeParts(reminder.time);
  const channelId = Platform.OS === 'android' ? CHANNEL_ID : undefined;
  let trigger: Notifications.SchedulableNotificationTriggerInput;

  if (reminder.recurrence === 'daily') {
    trigger = { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId };
  } else if (reminder.recurrence === 'weekly') {
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: new Date().getDay() + 1,
      hour,
      minute,
      channelId,
    };
  } else {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    if (date.getTime() <= Date.now()) date.setDate(date.getDate() + 1);
    trigger = { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId };
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body: reminder.description || 'Hora do seu lembrete.',
      sound: true,
      categoryIdentifier: REMINDER_CATEGORY,
      data: { reminderId: reminder.id },
    },
    trigger,
  });
}

export async function scheduleSnooze(reminder: Reminder) {
  if (Platform.OS === 'web') return scheduleWebNotification(reminder, 600000, false);
  return Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body: reminder.description || 'Lembrete adiado.',
      sound: true,
      categoryIdentifier: REMINDER_CATEGORY,
      data: { reminderId: reminder.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 600,
      channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
    },
  });
}
