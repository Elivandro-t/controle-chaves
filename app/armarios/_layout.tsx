import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Layout() {
  const router = useRouter();
  const [filialId, setFilialId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { semVoltar } = useLocalSearchParams();

  // Busca a filial salva no storage para injetar no Topo
  useEffect(() => {
    async function carregarFilial() {
      try {
        const id = await AsyncStorage.getItem('selectedFilial');
        if (id) {
          setFilialId(id);
        }
      } catch (error) {
        console.error('Erro ao buscar filial no layout:', error);
      } finally {
        setLoading(false);
      }
    }
    carregarFilial();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f0f9ff', // Light mode corporativo
        },
        headerTintColor: '#0f172a', // Texto/Ícone escuro para contraste
        headerTitleAlign: 'left',
        headerShadowVisible: false, // Remove a linha feia de divisão do header
        headerLeft: () => {
          if (semVoltar === "true") {
            return (
               <TouchableOpacity
            style={{ marginRight: 15 }}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/filial')}
          >
            <Ionicons name="arrow-back-circle-outline" size={32} color="#0f172a" />
          </TouchableOpacity>
            ); // Não renderiza o botão de voltar
          }
        },
        headerTitle: () => (
          <View style={styles.headerContainer}>
            {loading ? (
              <ActivityIndicator size="small" color="#0a7ea4" />
            ) : (
              <View>
                <Text style={styles.title}>Filial {filialId || '—'}</Text>
                <Text style={styles.subtitle}>Módulos de Armários</Text>
              </View>
            )}
          </View>
        ),
      }}
    >
      <Stack.Screen name="index" options={{ title: '' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    justifyContent: 'center',
    minWidth: 150,
  },
  title: {
    color: '#0f172a', // Cor escura padrão corporativa
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#64748b', // Slate gray para o subtítulo
    fontSize: 12,
  },
});