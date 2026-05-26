import { useAuth } from '@clerk/clerk-expo';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

interface ExerciseEntry {
  name: string;
  sets: string;
  reps: string;
  weightKg: string;
}

export default function CreateWorkoutScreen() {
  const { getToken } = useAuth();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<ExerciseEntry[]>([
    { name: '', sets: '', reps: '', weightKg: '' },
  ]);
  const [saving, setSaving] = useState(false);

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: '', reps: '', weightKg: '' }]);
  };

  const updateExercise = (index: number, field: string, value: string) => {
    const updated = [...exercises];
    (updated[index] as any)[field] = value;
    setExercises(updated);
  };

  const removeExercise = (index: number) => {
    if (exercises.length === 1) return;
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Workout title is required');
      return;
    }

    const validExercises = exercises
      .filter((e) => e.name.trim())
      .map((e) => ({
        name: e.name.trim(),
        sets: parseInt(e.sets) || 0,
        reps: parseInt(e.reps) || 0,
        weightKg: parseFloat(e.weightKg) || 0,
      }));

    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/workouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          date,
          duration: parseInt(duration) || 0,
          notes,
          exercises: validExercises,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      Alert.alert('Done', 'Workout saved!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save workout');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Workout</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Workout title"
            placeholderTextColor="#64748B"
            value={title}
            onChangeText={setTitle}
          />

          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor="#64748B"
              value={date}
              onChangeText={setDate}
            />
            <TextInput
              style={[styles.input, { flex: 0.5, marginLeft: 8 }]}
              placeholder="Min"
              placeholderTextColor="#64748B"
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
            />
          </View>

          <Text style={styles.sectionTitle}>Exercises</Text>

          {exercises.map((exercise, index) => (
            <View key={index} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseNumber}>{index + 1}</Text>
                {exercises.length > 1 && (
                  <TouchableOpacity onPress={() => removeExercise(index)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Exercise name"
                placeholderTextColor="#64748B"
                value={exercise.name}
                onChangeText={(v) => updateExercise(index, 'name', v)}
              />

              <View style={styles.exerciseRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="Sets"
                  placeholderTextColor="#64748B"
                  value={exercise.sets}
                  onChangeText={(v) => updateExercise(index, 'sets', v)}
                  keyboardType="number-pad"
                />
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="Reps"
                  placeholderTextColor="#64748B"
                  value={exercise.reps}
                  onChangeText={(v) => updateExercise(index, 'reps', v)}
                  keyboardType="number-pad"
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Weight kg"
                  placeholderTextColor="#64748B"
                  value={exercise.weightKg}
                  onChangeText={(v) => updateExercise(index, 'weightKg', v)}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addExerciseButton} onPress={addExercise}>
            <Text style={styles.addExerciseText}>+ Add Exercise</Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Notes (optional)"
            placeholderTextColor="#64748B"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Workout</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backText: { color: '#3B82F6', fontSize: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#F8FAFC' },
  form: { paddingHorizontal: 24, gap: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginTop: 8 },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
  },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  exerciseCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E3A5F',
    textAlign: 'center',
    lineHeight: 28,
    overflow: 'hidden',
  },
  removeText: { color: '#EF4444', fontSize: 14 },
  exerciseRow: { flexDirection: 'row' },
  addExerciseButton: {
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  addExerciseText: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});