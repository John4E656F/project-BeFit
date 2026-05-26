import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weightKg: number;
}

interface Workout {
  id: string;
  title: string;
  exercises: Exercise[];
  date: string;
  duration: number;
  notes: string;
  createdAt: string;
}

export default function DashboardScreen() {
  const { getToken, isSignedIn } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchWorkouts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/workouts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setWorkouts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load workouts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isSignedIn) fetchWorkouts();
  }, [isSignedIn]);

  const renderWorkout = ({ item }: { item: Workout }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDate}>{item.date}</Text>
      </View>
      {item.duration > 0 && (
        <Text style={styles.cardMeta}>⏱ {item.duration} min</Text>
      )}
      {item.exercises?.length > 0 && (
        <View style={styles.exercises}>
          {item.exercises.slice(0, 3).map((ex, i) => (
            <Text key={i} style={styles.exerciseText}>
              {ex.name}: {ex.sets}×{ex.reps} @ {ex.weightKg}kg
            </Text>
          ))}
          {item.exercises.length > 3 && (
            <Text style={styles.moreText}>+{item.exercises.length - 3} more</Text>
          )}
        </View>
      )}
      {item.notes ? (
        <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workouts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/workouts')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchWorkouts()}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : workouts.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No workouts yet</Text>
          <Text style={styles.emptySubtext}>Tap + to create your first one</Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          renderItem={renderWorkout}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchWorkouts(true)}
              tintColor="#3B82F6"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#F8FAFC' },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 24, fontWeight: '600' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#F8FAFC' },
  cardDate: { fontSize: 14, color: '#64748B' },
  cardMeta: { fontSize: 14, color: '#3B82F6', marginBottom: 8 },
  exercises: { marginBottom: 8, gap: 4 },
  exerciseText: { fontSize: 14, color: '#94A3B8' },
  moreText: { fontSize: 13, color: '#3B82F6', marginTop: 2 },
  notes: { fontSize: 14, color: '#64748B', fontStyle: 'italic' },
  errorText: { color: '#EF4444', fontSize: 16, marginBottom: 8 },
  retryText: { color: '#3B82F6', fontSize: 14 },
  emptyText: { color: '#64748B', fontSize: 18, marginBottom: 4 },
  emptySubtext: { color: '#475569', fontSize: 14 },
});