import { useAuth, useUser } from '@clerk/clerk-expo';
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

const GOALS = [
  { value: 'build_muscle', label: 'Build Muscle' },
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'maintain', label: 'Maintain' },
];

export default function ProfileScreen() {
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProfile(data);
      setName(data.name || '');
      setGoal(data.goal || '');
    } catch {
      // Profile might auto-create on first fetch
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim(), goal }),
      });

      if (!res.ok) throw new Error('Failed to update');
      Alert.alert('Saved', 'Profile updated');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    signOut();
    router.replace('/(auth)/sign-in');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Profile</Text>

      {/* User info from Clerk */}
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.emailAddresses?.[0]?.emailAddress?.[0] || '?').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.email}>
          {user?.emailAddresses?.[0]?.emailAddress || 'No email'}
        </Text>
      </View>

      {/* Editable fields */}
      <View style={styles.form}>
        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor="#64748B"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Fitness Goal</Text>
        <View style={styles.goalRow}>
          {GOALS.map((g) => (
            <TouchableOpacity
              key={g.value}
              style={[styles.goalChip, goal === g.value && styles.goalChipActive]}
              onPress={() => setGoal(g.value)}
            >
              <Text
                style={[styles.goalText, goal === g.value && styles.goalTextActive]}
              >
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Profile</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  content: { padding: 24, paddingTop: 60 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#F8FAFC', marginBottom: 24 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  email: { color: '#94A3B8', fontSize: 16 },
  form: { gap: 16 },
  label: { color: '#94A3B8', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
  },
  goalRow: { flexDirection: 'row', gap: 8 },
  goalChip: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  goalChipActive: {
    backgroundColor: '#1E3A5F',
    borderColor: '#3B82F6',
  },
  goalText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  goalTextActive: { color: '#3B82F6' },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  signOutButton: {
    marginTop: 32,
    alignItems: 'center',
    padding: 16,
  },
  signOutText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
});