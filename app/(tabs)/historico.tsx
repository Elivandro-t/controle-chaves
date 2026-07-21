import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { clearAuthStorage } from '../../services/storage';

export default function HistoricoScreen() {
  const router = useRouter();

  async function handleLogout() {
    await clearAuthStorage();
    router.replace('/login');
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Text style={styles.title}>Histórico</Text>
        <Text style={styles.subtitle}>Em breve, você verá os registros de chaves entregues, recebidas e em uso.</Text>

        <Pressable style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Sair</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    backgroundColor: '#eef2ff',
  },
  container: {
    padding: 24,
    gap: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    color: '#475569',
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#0a7ea4',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
