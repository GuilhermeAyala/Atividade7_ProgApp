import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { RemindersProvider } from '@/context/RemindersContext';

export default function RootLayout() {
  return (
    <RemindersProvider>
      <StatusBar style="dark" />
      <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#246B5A', tabBarInactiveTintColor: '#8A9691' }}>
        <Tabs.Screen name="index" options={{ title: 'Lembretes' }} />
        <Tabs.Screen name="new" options={{ title: 'Novo lembrete' }} />
      </Tabs>
    </RemindersProvider>
  );
}
