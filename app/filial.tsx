import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { filiaisPermitidas, setOnSessionExpired } from '../services/api';
import { clearAuthStorage, getUserId } from '../services/storage';
import { showError } from '../services/toast';

export default function FilialScreen() {
  const [loadingFilial, setLoadingFilial] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filiais, setFiliais] = useState<{ id: any, filial: number; nome: string }[]>([]);
  const router = useRouter();
  const type = "filial_arm"
  // Register session expired callback
  useEffect(() => {
    setOnSessionExpired(() => {
      showError('Sessão expirada', 'Faça login novamente');
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    async function loadFiliais() {
      try {
        const usuarioID = await getUserId();
        const data = await filiaisPermitidas(usuarioID);
        if (!mounted) return;
        setFiliais(data?.acess);
        // Auto-navegação se houver apenas uma filial
        if (data?.acess.length === 1) {
          await AsyncStorage.setItem('selectedFilial', String(data.acess[0].filial));
          if (mounted) {
            router.replace({
              pathname: "/armarios",
              params: {
                filial: data.acess[0].filial,
                type: type,
                semVoltar: "true"
              }
            });
          }
          return;
        }

      } catch (err: any) {
        if (!mounted) return;

        console.error('Erro ao buscar armários - Full error:', err);

        if (err?.code === 'SESSION_EXPIRED' || err?.message?.includes('SESSION_EXPIRED')) {
          await clearAuthStorage();
          router.replace('/login');
          return;
        }

        setError(`Erro ao carregar filiais: ${err?.message || 'desconhecido'}`);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    // >>> O ERRO PRINCIPAL ESTAVA AQUI: Faltava invocar a função! <<<
    loadFiliais();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleSelectFilial(id: number) {
    setLoadingFilial(true);
    await AsyncStorage.setItem('selectedFilial', String(id));
    const filial = await AsyncStorage.getItem('selectedFilial');
    router.push({
      pathname: "/armarios",
      params: {
        filial: filial as any,
        type: type
      }
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      {/* Forçando o cabeçalho a ficar na paleta clara corporativa */}
      <Stack.Screen
        options={{
          title: 'Selecione sua filial',
          headerStyle: { backgroundColor: '#f0f9ff' },
          headerTintColor: '#0f172a',
          headerShadowVisible: false,
        }}
      />
      <View style={styles.container}>
        <Text style={styles.title}>Selecione sua filial</Text>
        <Text style={styles.subtitle}>Escolha a filial que você está usando para acessar o controle de armários.</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0a7ea4" />
        ) : error ? (
          <Text style={{ color: '#b91c1c', fontWeight: '600' }}>{error}</Text>
        ) : (
          filiais.map((filial) => (
            <Pressable
              key={filial.filial}
              style={styles.filialCard}
              onPress={() => handleSelectFilial(filial.filial)}
              disabled={loadingFilial}
            >
              <Text style={styles.filialLabel}>{filial?.nome}</Text>
              <Text style={styles.filialHint}>Filial {filial.filial}</Text>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    backgroundColor: '#f0f9ff',
  },
  container: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    color: '#475569',
    fontSize: 16,
    marginBottom: 16,
  },
  filialCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  filialLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  filialHint: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
});