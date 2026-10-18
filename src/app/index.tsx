import { ActivityIndicator, Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Reminder } from '@/lib/notifications';
import { useReminders } from '@/context/RemindersContext';

const RECURRENCE_LABEL = { once: 'Uma vez', daily: 'Todos os dias', weekly: 'Toda semana' };

export default function RemindersScreen() {
  const { reminders, ready, completeReminder, snoozeReminder, toggleReminder, cancelAllNotifications, deleteReminder } = useReminders();
  const active = reminders.filter((reminder) => !reminder.done);

  if (!ready) return <View style={styles.loader}><ActivityIndicator color="#246B5A" /></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View><Text style={styles.eyebrow}>BOM DIA</Text><Text style={styles.title}>Seus lembretes</Text></View>
              <Pressable style={styles.addButton} onPress={() => router.push('/new')}><Text style={styles.addText}>+ Novo</Text></Pressable>
            </View>
            <View style={styles.summary}><Text style={styles.summaryNumber}>{active.length}</Text><Text style={styles.summaryText}>lembrete{active.length === 1 ? '' : 's'} para cuidar hoje</Text></View>
            {reminders.length > 0 && <Pressable onPress={() => Alert.alert('Cancelar notificações?', 'Os lembretes serão mantidos, mas nenhum alerta será exibido.', [{ text: 'Voltar', style: 'cancel' }, { text: 'Cancelar alertas', style: 'destructive', onPress: cancelAllNotifications }])}><Text style={styles.cancelAll}>Cancelar todas as notificações</Text></Pressable>}
            <Text style={styles.sectionTitle}>{reminders.length ? 'SEUS LEMBRETES' : 'COMECE POR AQUI'}</Text>
          </>
        }
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyIcon}>◷</Text><Text style={styles.emptyTitle}>Tudo tranquilo por enquanto</Text><Text style={styles.emptyText}>Crie um lembrete para não esquecer o que importa.</Text><Pressable style={styles.emptyButton} onPress={() => router.push('/new')}><Text style={styles.emptyButtonText}>Criar lembrete</Text></Pressable></View>}
        renderItem={({ item }) => <ReminderCard reminder={item} onComplete={completeReminder} onSnooze={snoozeReminder} onToggle={toggleReminder} onDelete={deleteReminder} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </SafeAreaView>
  );
}

function ReminderCard({ reminder, onComplete, onSnooze, onToggle, onDelete }: { reminder: Reminder; onComplete: (id: string) => void; onSnooze: (id: string) => void; onToggle: (id: string, enabled: boolean) => void; onDelete: (id: string) => void }) {
  return <View style={[styles.card, reminder.done && styles.cardDone]}>
    <View style={styles.cardTop}><View style={{ flex: 1 }}><Text style={[styles.cardTitle, reminder.done && styles.muted]}>{reminder.title}</Text><Text style={styles.description}>{reminder.description || 'Sem descrição'}</Text></View><Switch value={reminder.enabled} disabled={reminder.done} onValueChange={(value) => onToggle(reminder.id, value)} trackColor={{ false: '#D7DEDA', true: '#8CCAB9' }} thumbColor={reminder.enabled ? '#246B5A' : '#F8FAF9'} /></View>
    <View style={styles.details}><Text style={styles.time}>◷  {reminder.time}</Text><Text style={styles.badge}>{RECURRENCE_LABEL[reminder.recurrence]}</Text></View>
    {!reminder.done && <View style={styles.actions}><Pressable style={styles.complete} onPress={() => onComplete(reminder.id)}><Text style={styles.completeText}>Concluir</Text></Pressable><Pressable style={styles.snooze} onPress={() => onSnooze(reminder.id)}><Text style={styles.snoozeText}>Adiar 10 min</Text></Pressable><Pressable onPress={() => onToggle(reminder.id, false)}><Text style={styles.cancel}>Cancelar alerta</Text></Pressable></View>}
    {reminder.done && <View style={styles.actions}><Text style={styles.finished}>✓ Concluído</Text><Pressable onPress={() => onDelete(reminder.id)}><Text style={styles.cancel}>Excluir</Text></Pressable></View>}
  </View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F8F7' }, loader: { flex: 1, alignItems: 'center', justifyContent: 'center' }, content: { padding: 20, paddingBottom: 36 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 24 }, eyebrow: { color: '#6C7E76', fontSize: 11, fontWeight: '700', letterSpacing: 1.1 }, title: { color: '#183C32', fontSize: 28, fontWeight: '700', marginTop: 4 }, addButton: { backgroundColor: '#246B5A', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 }, addText: { color: '#FFF', fontWeight: '700' }, summary: { backgroundColor: '#DDF1E9', padding: 18, borderRadius: 18, flexDirection: 'row', alignItems: 'baseline', gap: 8 }, summaryNumber: { color: '#246B5A', fontSize: 30, fontWeight: '800' }, summaryText: { color: '#315C50', fontSize: 14 }, cancelAll: { color: '#BD4E4E', fontSize: 13, fontWeight: '600', textAlign: 'right', marginTop: 14 }, sectionTitle: { color: '#6C7E76', fontSize: 11, letterSpacing: 1.1, fontWeight: '800', marginTop: 25, marginBottom: 12 }, card: { backgroundColor: '#FFF', borderRadius: 18, padding: 17, borderWidth: 1, borderColor: '#E5EBE8' }, cardDone: { opacity: 0.68 }, cardTop: { flexDirection: 'row', gap: 12 }, cardTitle: { color: '#183C32', fontSize: 17, fontWeight: '700' }, muted: { textDecorationLine: 'line-through' }, description: { color: '#6C7E76', fontSize: 13, marginTop: 5, lineHeight: 18 }, details: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 }, time: { color: '#315C50', fontSize: 14, fontWeight: '700' }, badge: { backgroundColor: '#EEF4F1', color: '#537167', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, fontSize: 11 }, actions: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 18, flexWrap: 'wrap' }, complete: { backgroundColor: '#246B5A', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 10 }, completeText: { color: '#FFF', fontWeight: '700', fontSize: 12 }, snooze: { backgroundColor: '#EAF2EF', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }, snoozeText: { color: '#315C50', fontWeight: '700', fontSize: 12 }, cancel: { color: '#A45B5B', fontWeight: '600', fontSize: 12 }, finished: { color: '#246B5A', fontWeight: '700', fontSize: 13 }, empty: { alignItems: 'center', paddingHorizontal: 25, paddingVertical: 58, backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: '#E5EBE8' }, emptyIcon: { fontSize: 42, color: '#79AA9C' }, emptyTitle: { color: '#183C32', fontSize: 18, fontWeight: '700', marginTop: 12 }, emptyText: { color: '#6C7E76', textAlign: 'center', lineHeight: 20, marginTop: 8 }, emptyButton: { backgroundColor: '#246B5A', marginTop: 22, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 11 }, emptyButtonText: { color: '#FFF', fontWeight: '700' },
});
