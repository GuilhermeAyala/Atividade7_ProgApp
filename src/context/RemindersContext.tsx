import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  cancelNotification,
  configureNotifications,
  DONE_ACTION,
  Reminder,
  scheduleReminder,
  scheduleSnooze,
  SNOOZE_ACTION,
} from '@/lib/notifications';

const STORAGE_KEY = '@lembra_ai/reminders';

type NewReminder = Pick<Reminder, 'title' | 'description' | 'time' | 'recurrence'>;
type RemindersContextValue = {
  reminders: Reminder[];
  ready: boolean;
  addReminder: (reminder: NewReminder) => Promise<void>;
  completeReminder: (id: string) => Promise<void>;
  snoozeReminder: (id: string) => Promise<void>;
  toggleReminder: (id: string, enabled: boolean) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
};

const RemindersContext = createContext<RemindersContextValue | null>(null);

export function RemindersProvider({ children }: PropsWithChildren) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [ready, setReady] = useState(false);
  const remindersRef = useRef<Reminder[]>([]);

  const persist = useCallback(async (next: Reminder[]) => {
    remindersRef.current = next;
    setReminders(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const completeReminder = useCallback(async (id: string) => {
    const reminder = remindersRef.current.find((item) => item.id === id);
    if (!reminder) return;
    await cancelNotification(reminder.notificationId);
    await cancelNotification(reminder.snoozeNotificationId);
    await persist(
      remindersRef.current.map((item) =>
        item.id === id ? { ...item, done: true, enabled: false, notificationId: undefined, snoozeNotificationId: undefined } : item,
      ),
    );
  }, [persist]);

  const snoozeReminder = useCallback(async (id: string) => {
    const reminder = remindersRef.current.find((item) => item.id === id);
    if (!reminder) return;
    if (reminder.recurrence === 'once') await cancelNotification(reminder.notificationId);
    await cancelNotification(reminder.snoozeNotificationId);
    const snoozeNotificationId = await scheduleSnooze(reminder);
    await persist(
      remindersRef.current.map((item) =>
        item.id === id ? { ...item, enabled: true, done: false, snoozeNotificationId } : item,
      ),
    );
  }, [persist]);

  const addReminder = useCallback(async (input: NewReminder) => {
    const reminder: Reminder = {
      ...input,
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      enabled: true,
      done: false,
    };
    // No navegador, a permissão precisa ser solicitada a partir do toque no
    // botão de salvar; os navegadores podem bloquear prompts disparados no
    // carregamento da página.
    if (Platform.OS === 'web') await configureNotifications().catch(() => false);
    const notificationId = await scheduleReminder(reminder).catch(() => undefined);
    await persist([{ ...reminder, notificationId }, ...remindersRef.current]);
  }, [persist]);

  const toggleReminder = useCallback(async (id: string, enabled: boolean) => {
    const reminder = remindersRef.current.find((item) => item.id === id);
    if (!reminder) return;
    await cancelNotification(reminder.notificationId);
    await cancelNotification(reminder.snoozeNotificationId);
    const notificationId = enabled ? await scheduleReminder({ ...reminder, enabled: true }).catch(() => undefined) : undefined;
    await persist(
      remindersRef.current.map((item) =>
        item.id === id ? { ...item, enabled, done: false, notificationId, snoozeNotificationId: undefined } : item,
      ),
    );
  }, [persist]);

  const cancelAllNotifications = useCallback(async () => {
    await Promise.all(remindersRef.current.flatMap((item) => [cancelNotification(item.notificationId), cancelNotification(item.snoozeNotificationId)]));
    await persist(remindersRef.current.map((item) => ({ ...item, enabled: false, notificationId: undefined, snoozeNotificationId: undefined })));
  }, [persist]);

  const deleteReminder = useCallback(async (id: string) => {
    const reminder = remindersRef.current.find((item) => item.id === id);
    await cancelNotification(reminder?.notificationId);
    await cancelNotification(reminder?.snoozeNotificationId);
    await persist(remindersRef.current.filter((item) => item.id !== id));
  }, [persist]);

  useEffect(() => {
    async function start() {
      await configureNotifications().catch(() => false);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const saved = JSON.parse(stored) as Reminder[];
        const hydrated = Platform.OS === 'web'
          ? await Promise.all(saved.map(async (item) => {
              if (!item.enabled || item.done) return item;
              const notificationId = await scheduleReminder(item).catch(() => undefined);
              return { ...item, notificationId };
            }))
          : saved;
        remindersRef.current = hydrated;
        setReminders(hydrated);
        if (Platform.OS === 'web') await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(hydrated));
      }
      setReady(true);
    }
    start();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const id = response.notification.request.content.data?.reminderId;
      if (typeof id !== 'string') return;
      if (response.actionIdentifier === DONE_ACTION) completeReminder(id);
      if (response.actionIdentifier === SNOOZE_ACTION) snoozeReminder(id);
    });
    return () => subscription.remove();
  }, [completeReminder, snoozeReminder]);

  return (
    <RemindersContext.Provider
      value={{ reminders, ready, addReminder, completeReminder, snoozeReminder, toggleReminder, cancelAllNotifications, deleteReminder }}>
      {children}
    </RemindersContext.Provider>
  );
}

export function useReminders() {
  const context = useContext(RemindersContext);
  if (!context) throw new Error('useReminders deve ser usado dentro de RemindersProvider');
  return context;
}
