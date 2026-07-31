import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { armariosFiliais } from '../../services/api';
import LockerCard from './LockerCard';

interface ArmarioUnidade {
  id: number;
  numero: number;
  ativo: boolean;
  disponivel: boolean;
  status: 'LIVRE' | 'OCUPADO' | 'MANUTENCAO' | 'BLOQUEADO';
}

interface BlocoFilial {
  id: number;
  filial: number;
  tipo: string;
  armariosUnidade: ArmarioUnidade[];
}

export default function Index() {
  const router = useRouter();
  const [filialId, setFilialId] = useState<string | null>(null);
  const [verificandoStorage, setVerificandoStorage] = useState(true);
  const { type } = useLocalSearchParams<{
    type: string;
  }>();
  // 1. Recupera a filial salva de forma segura
  useEffect(() => {
    async function obterFilial() {
      try {
        const id = await AsyncStorage.getItem('selectedFilial');
        if (!id) {
          Alert.alert('Aviso', 'Nenhuma filial selecionada. Por favor, selecione uma unidade.');
          router.replace('/filial');
          return;
        }
        setFilialId(id);
      } catch (err) {
        console.error('Erro ao ler AsyncStorage:', err);
      } finally {
        setVerificandoStorage(false);
      }
    }
    obterFilial();
  }, []);

  // 2. Hook do React Query
  const { data: blocos = [], isLoading, error, isFetching } = useQuery<BlocoFilial[]>({
    queryKey: ['blocosFilial', filialId],
    queryFn: () => armariosFiliais(Number(filialId)),
    enabled: !!filialId && filialId !== '',
    staleTime: 10000,
    retry: 2,
  });

  // Mapeamento de Ícones Profissionais e Cores de Destaque Dinâmicas
  const obterConfiguracaoTipo = (tipo: string) => {
    switch (tipo.toUpperCase()) {
      case 'VESTIARIO_MASCULINO':
        return { nome: 'gender-male' as const, cor: '#0284c7' };
      case 'VESTIARIO_FEMININO':
        return { nome: 'gender-female' as const, cor: '#db2777' };
      case 'PORTARIA_FRIOS':
        return { nome: 'snowflake' as const, cor: '#0284c7' };
      case 'PORTARIA_SECOS':
        return { nome: 'package-variant-closed' as const, cor: '#d97706' };
      case 'HORTIFRUTI':
        return { nome: 'food-apple-outline' as const, cor: '#16a34a' };
      default:
        return { nome: 'key-outline' as const, cor: '#475569' };
    }
  };

  const formatarNomeTipo = (tipo: string) => {
    return tipo
      .replace('_', ' ')
      .toLowerCase()
      .replace(/(^\w{1})|(\s+\w{1})/g, (letter) => letter.toUpperCase());
  };

  const handleCardPress = async (blocoId: number, tipo: string, filialis: any) => {
    if (type === "filial_arm") {
      const armarioSelecionado = {
        armarioId: blocoId,
        tipo,
        filial: filialis,
      };

      await AsyncStorage.setItem(
        "selectedArm",
        JSON.stringify(armarioSelecionado)
      );

      router.replace("/home");
      return;
    }
    if (type === "chaves-em-uso") {
      router.push({
        pathname: `/armarios/ocupados` as any,
        params: {
          armarioId: String(blocoId),
          tipo: String(tipo),
          filial: String(filialis),
        },
      });
    } else {
      router.push({
        pathname: `/armarios/ArmariosScreen` as any,
        params: {
          armarioId: String(blocoId),
          tipo: String(tipo),
          filial: String(filialis),
        },
      });
    }
  };

  if (verificandoStorage || (isLoading && filialId)) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.loadingText}>Sincronizando módulos da Portaria...</Text>
      </View>
    );
  }

  if (error || (!isLoading && blocos.length === 0 && filialId)) {
    return (
      <View style={[styles.container, styles.center]}>
        <MaterialCommunityIcons name="cloud-off-outline" size={54} color="#b91c1c" />
        <Text style={styles.errorText}>Não foi possível conectar ao servidor.</Text>
        <Text style={styles.errorSubtitle}>Verifique se a API está rodando no IP correto.</Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.replace('/filial')}
        >
          <Text style={styles.retryButtonText}>Voltar e Selecionar Filial</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `Filial ${filialId}`,
          headerStyle: { backgroundColor: '#f0f9ff' },
          headerTintColor: '#0f172a',
          headerShadowVisible: false
        }}
      />

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.headerCounter}>
            {blocos.length} {blocos.length === 1 ? 'MÓDULO ENCONTRADO' : 'MÓDULOS ENCONTRADOS'}
          </Text>
          {isFetching && <ActivityIndicator size="small" color="#0a7ea4" />}
        </View>

        {blocos.map((bloco) => {
          const total = bloco.armariosUnidade?.length || 0;
          const livres = bloco.armariosUnidade?.filter((a) => a.status === 'LIVRE' || a.disponivel).length || 0;
          const ocupadas = bloco.armariosUnidade?.filter((a) => a.status === 'OCUPADO').length || 0;

          const configIcone = obterConfiguracaoTipo(bloco.tipo);

          return (
            <TouchableOpacity
              key={bloco.id}
              onPress={() => handleCardPress(bloco.id, bloco.tipo, bloco?.filial)}
              activeOpacity={0.7}
              style={styles.cardPressable}
            >
              <LockerCard
                icon={
                  <View style={[styles.iconWrapper, { backgroundColor: configIcone.cor + '15' }]}>
                    <MaterialCommunityIcons
                      name={configIcone.nome}
                      size={26}
                      color={configIcone.cor}
                    />
                  </View>
                }
                title={formatarNomeTipo(bloco.tipo)}
                livres={livres}
                ocupadas={ocupadas}
                total={total}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerCounter: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  cardPressable: {
    marginBottom: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconWrapper: {
    padding: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748b',
    marginTop: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#b91c1c',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
  },
  errorSubtitle: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  retryButtonText: {
    color: '#0a7ea4',
    fontWeight: '700',
    fontSize: 14,
  },
});