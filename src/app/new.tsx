import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Recurrence } from '@/lib/notifications';
import { useReminders } from '@/context/RemindersContext';

const options: { value: Recurrence; label: string; helper: string }[] = [
  { value: 'once', label: 'Uma vez', helper: 'No próximo horário informado' },
  { value: 'daily', label: 'Todos os dias', helper: 'No mesmo horário' },
  { value: 'weekly', label: 'Toda semana', helper: 'No dia de hoje, semanalmente' },
];

export default function NewReminderScreen() {
  const { addReminder } = useReminders();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('09:00');
  const [recurrence, setRecurrence] = useState<Recurrence>('once');

  async function save() {
    if (!title.trim()) return Alert.alert('Dê um nome ao lembrete', 'Por exemplo: Beber água ou Reunião da equipe.');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return Alert.alert('Horário inválido', 'Use o formato 24 horas, como 09:30.');
    await addReminder({ title: title.trim(), description: description.trim(), time, recurrence });
    router.replace('/');
  }

  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.eyebrow}>NOVO LEMBRETE</Text><Text style={styles.title}>O que você quer lembrar?</Text>
    <Text style={styles.label}>Nome</Text><TextInput value={title} onChangeText={setTitle} placeholder="Ex.: Tomar o remédio" placeholderTextColor="#99A7A1" style={styles.input} maxLength={50} />
    <Text style={styles.label}>Descrição <Text style={styles.optional}>(opcional)</Text></Text><TextInput value={description} onChangeText={setDescription} placeholder="Adicione uma anotação" placeholderTextColor="#99A7A1" style={[styles.input, styles.textarea]} multiline textAlignVertical="top" maxLength={150} />
    <Text style={styles.label}>Horário</Text><View style={styles.timeBox}><Text style={styles.clock}>◷</Text><TextInput value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" placeholder="09:00" maxLength={5} style={styles.timeInput} /></View><Text style={styles.hint}>Use o formato de 24 horas, como 09:30.</Text>
    <Text style={styles.label}>Recorrência</Text><View style={styles.options}>{options.map((option) => <Pressable key={option.value} style={[styles.option, recurrence === option.value && styles.optionActive]} onPress={() => setRecurrence(option.value)}><View style={[styles.radio, recurrence === option.value && styles.radioActive]}>{recurrence === option.value && <View style={styles.radioDot} />}</View><View><Text style={styles.optionTitle}>{option.label}</Text><Text style={styles.optionHelper}>{option.helper}</Text></View></Pressable>)}</View>
    <Pressable style={styles.save} onPress={save}><Text style={styles.saveText}>Salvar lembrete</Text></Pressable><Pressable onPress={() => router.back()}><Text style={styles.back}>Voltar sem salvar</Text></Pressable>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F8F7' }, content: { padding: 20, paddingTop: 30, paddingBottom: 42 }, eyebrow: { color: '#6C7E76', fontSize: 11, fontWeight: '800', letterSpacing: 1.1 }, title: { color: '#183C32', fontSize: 27, fontWeight: '700', marginTop: 5, marginBottom: 27 }, label: { color: '#315C50', fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 18 }, optional: { color: '#87968F', fontWeight: '400' }, input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDE6E1', borderRadius: 12, paddingHorizontal: 14, height: 50, color: '#183C32', fontSize: 16 }, textarea: { height: 88, paddingTop: 13 }, timeBox: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDE6E1', borderRadius: 12, height: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }, clock: { color: '#246B5A', fontSize: 20, marginRight: 10 }, timeInput: { fontSize: 20, color: '#183C32', fontWeight: '700', flex: 1 }, hint: { color: '#819089', fontSize: 12, marginTop: 7 }, options: { gap: 9 }, option: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDE6E1', padding: 14, borderRadius: 13, flexDirection: 'row', gap: 12, alignItems: 'center' }, optionActive: { borderColor: '#246B5A', backgroundColor: '#F3FAF7' }, radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#A5B5AE', alignItems: 'center', justifyContent: 'center' }, radioActive: { borderColor: '#246B5A' }, radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#246B5A' }, optionTitle: { color: '#183C32', fontWeight: '700', fontSize: 15 }, optionHelper: { color: '#789087', fontSize: 12, marginTop: 3 }, save: { backgroundColor: '#246B5A', height: 52, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 30 }, saveText: { color: '#FFF', fontSize: 16, fontWeight: '800' }, back: { textAlign: 'center', color: '#597269', fontWeight: '600', padding: 18 },
});
