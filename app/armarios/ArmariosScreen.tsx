import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashList as ShopifyFlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { buscaBlocoArmario } from '../../services/api';

const FlashList = ShopifyFlashList as any;

interface ArmarioUnidade {
  id: number;
  chave: number;
  status: 'LIVRE' | 'OCUPADO' | 'MANUTENCAO' | 'BLOQUEADO';
  tipo: string;
  ativo?: boolean;
  disponivel?: boolean;
  usuarioAcesso?: string;
  armario: any;
  filial: number;
}

interface BlocoFilial {
  id: number;
  filial: number;
  tipo: string;
  bloco: ArmarioUnidade[];
}

const { width } = Dimensions.get('window');

export default function ArmariosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Pega o espaço exato da barra de notificações/status
  const { armarioId, tipo, filial, semVoltar } = useLocalSearchParams<{ armarioId?: string; tipo?: string, filial: any, semVoltar: any }>();
  const [filialId, setFilialId] = useState<string | null>(filial);
  const [perfilUsuario] = useState<'admin' | 'operador'>('admin');

  const [busca, setBusca] = useState('');
  const [estaPesquisando, setEstaPesquisando] = useState(false);

  const listRef = useRef<any>(null);
  const [mostrarBotaoTopo, setMostrarBotaoTopo] = useState(false);

  // Altura total do header considerando a barra de status dinâmica do aparelho
  const headerTotalHeight = 65 + insets.top;

  useEffect(() => {
    async function obterFilial() {
      const id = await AsyncStorage.getItem('selectedFilial');
      setFilialId(id);
    }
    obterFilial();
  }, []);

  const { data: blocoUnico = null, isLoading, error } = useQuery<BlocoFilial | null>({
    queryKey: ['ArmarioUnico', filialId, armarioId, tipo],
    queryFn: () => buscaBlocoArmario(Number(armarioId), tipo),
    enabled: !!filialId && !!armarioId,
    staleTime: 15000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 10000,
  });

  const todosArmarios = useMemo(() => {
    if (!blocoUnico) return [];
    if (Array.isArray(blocoUnico)) return blocoUnico;
    return blocoUnico.bloco || [];
  }, [blocoUnico]);

  const metricas = useMemo(() => {
    let disp = 0;
    let ocup = 0;
    let manut = 0;
    for (let i = 0; i < todosArmarios.length; i++) {
      const a = todosArmarios[i];
      if (a.status === 'LIVRE') disp++;
      if (a.status === 'OCUPADO') ocup++;
      if (a.status === 'MANUTENCAO') manut++;
    }
    return { disp, ocup, manut };
  }, [todosArmarios]);

  const armariosFiltradosEOrdenados = useMemo(() => {
    let resultado = [...todosArmarios];

    if (busca.trim() !== '') {
      resultado = resultado.filter((armario) =>
        String(armario.chave).includes(busca.trim())
      );
    }

    return resultado.sort((a, b) => a.chave - b.chave);
  }, [todosArmarios, busca]);

  const irParaDetalhes = useCallback((armario: ArmarioUnidade) => {
    router.push({
      pathname: '/armarios/detalhes' as any,
      params: {
        id: String(armario.id),
        numero: `${armario?.chave}`,
        status: armario.status.toLowerCase(),
        usuario: armario.usuarioAcesso || '',
        armarioId: `${armarioId}`,
        filial: filial
      },
    });
  }, [router, armarioId, filial]);

  const obterEstiloStatus = (status: string) => {
    if (status === 'OCUPADO') return { cor: '#dc2626', bg: '#fef2f2', textoStatus: 'Ocupado' };
    if (status === 'MANUTENCAO') return { cor: '#d97706', bg: '#fffbeb', textoStatus: 'Manutenção' };
    if (status === 'BLOQUEADO') return { cor: '#475569', bg: '#f1f5f9', textoStatus: 'Bloqueado' };
    return { cor: '#16a34a', bg: '#f0fdf4', textoStatus: 'Livre' };
  };

  const renderLockerItem = useCallback(({ item }: { item: ArmarioUnidade }) => {
    const config = obterEstiloStatus(item.status);
    const tipoFmt = item.tipo ? item.tipo.replace('_', ' ') : '';

    const ehLivre = item.status === 'LIVRE';
    const nomeIcone = ehLivre ? 'lock-open-outline' : 'lock-outline';
    const corIcone = ehLivre ? '#16a34a' : '#64748b';

    return (
      <TouchableOpacity
        style={styles.lockerCard}
        onPress={() => irParaDetalhes(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrapper, ehLivre && styles.iconWrapperLivre]}>
            <MaterialCommunityIcons name={nomeIcone} size={15} color={corIcone} />
          </View>
          <View style={[styles.badgeStatus, { backgroundColor: config.bg }]}>
            <Text style={[styles.badgeText, { color: config.cor }]}>{config.textoStatus}</Text>
          </View>
        </View>

        <Text style={styles.lockerIdText}>Nº {item.chave}</Text>
        <Text style={styles.userLabel} numberOfLines={1}>{tipoFmt}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.footerActionText}>Ver Detalhes</Text>
          <MaterialCommunityIcons name="chevron-right" size={14} color="#94a3b8" />
        </View>
      </TouchableOpacity>
    );
  }, [irParaDetalhes]);

  const limparPesquisa = () => {
    setBusca('');
    setEstaPesquisando(false);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const lidarComScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setMostrarBotaoTopo(offsetY > 400);
  };

  if (isLoading || !filialId) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.loadingText}>Carregando armários da filial...</Text>
      </View>
    );
  }

  if (error || !blocoUnico) {
    return (
      <View style={[styles.container, styles.center]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#dc2626" />
        <Text style={styles.errorText}>Erro ao carregar dados do módulo.</Text>
      </View>
    );
  }

  function handleNavigantionToInstallNewArmario(): void {
    router.push({
      pathname: '/entregar/createChaves' as any,
      params: {
        armarioId: String(armarioId),
        filial: filial,
        tipo: tipo
      },
    });
  }

  return (
      <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { 
            backgroundColor: '#f0f9ff',
            // Removido o 'height' daqui para evitar o erro do TypeScript
          },
          headerTintColor: '#0f172a',
          headerTitleAlign: 'left',
          headerShadowVisible: false,
          
          headerLeft: () => {
            if (semVoltar === "true") {
              return null;
            }
            return (
              <TouchableOpacity
                style={[styles.backButton, { marginTop: insets.top }]}
                onPress={() => router.canGoBack() ? router.back() : router.replace('/filial')}
              >
                <Ionicons name="arrow-back-circle-outline" size={32} color="#0f172a" />
              </TouchableOpacity>
            );
          },

          headerTitle: () => (
            <View style={[styles.headerContainer, { marginTop: insets.top }]}>
              <Text style={styles.headerTitle}>Painel de Controle</Text>
              <Text style={styles.headerSubtitle}>Filial {filialId} • {metricas.ocup} ocupados</Text>
              {perfilUsuario === 'admin' && !estaPesquisando ? (
                <TouchableOpacity
                  style={styles.installButton}
                  onPress={() => handleNavigantionToInstallNewArmario()}
                  activeOpacity={0.7}
                >
                  <View style={styles.installIconCircle}>
                    <Ionicons name="add" size={20} color="#0a7ea4" />
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>
          ),
        }}
      />
      <FlashList
        ref={listRef}
        data={armariosFiltradosEOrdenados}
        renderItem={renderLockerItem}
        keyExtractor={(item: ArmarioUnidade) => `${item.id}-${item.chave}`}
        numColumns={2}
        estimatedItemSize={125}
        estimatedListSize={{ width: width, height: 600 }}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={lidarComScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={(
          <View style={styles.headerComponentContainer}>
            <View style={[styles.searchContainer, estaPesquisando && styles.searchContainerFocused]}>
              <Ionicons name="search" size={18} color={estaPesquisando ? "#0a7ea4" : "#64748b"} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar pelo número do armário..."
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={busca}
                onChangeText={setBusca}
                onFocus={() => setEstaPesquisando(true)}
                onBlur={() => {
                  if (busca === '') setEstaPesquisando(false);
                }}
              />
              {estaPesquisando && (
                <TouchableOpacity onPress={limparPesquisa} style={styles.clearButton}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              )}
            </View>

            {!estaPesquisando && (
              <View style={styles.hubContainer}>
                <View style={[styles.hubCard, { borderLeftColor: '#16a34a' }]}>
                  <Text style={[styles.hubNumber, { color: '#16a34a' }]}>{metricas.disp}</Text>
                  <Text style={styles.hubLabel}>Disponíveis</Text>
                </View>
                <View style={[styles.hubCard, { borderLeftColor: '#dc2626' }]}>
                  <Text style={[styles.hubNumber, { color: '#dc2626' }]}>{metricas.ocup}</Text>
                  <Text style={styles.hubLabel}>Ocupados</Text>
                </View>
                <View style={[styles.hubCard, { borderLeftColor: '#d97706' }]}>
                  <Text style={[styles.hubNumber, { color: '#d97706' }]}>{metricas.manut}</Text>
                  <Text style={styles.hubLabel}>Reparo</Text>
                </View>
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {estaPesquisando ? "Resultados da Busca" : "Módulos de Armários"}
              </Text>
              {!estaPesquisando && (
                <Text style={styles.sectionSubtitle}>Exibindo dados do Bloco ID: {armarioId}</Text>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.center}>
            <MaterialCommunityIcons name="locker" size={36} color="#94a3b8" />
            <Text style={[styles.loadingText, { marginTop: 8 }]}>Nenhum armário encontrado.</Text>
          </View>
        )}
      />

      {mostrarBotaoTopo && (
        <TouchableOpacity
          style={styles.fabTopo}
          onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f9ff' },
  center: { justifyContent: 'center', alignItems: 'center', paddingVertical: 32 },
  loadingText: { color: '#475569', marginTop: 12, fontSize: 13, textAlign: 'center' },
  errorText: { color: '#dc2626', marginTop: 12, fontSize: 13, fontWeight: '600' },
  headerTitle: { color: '#0f172a', fontSize: 17, fontWeight: '800' },
  headerSubtitle: { color: '#475569', fontSize: 12, marginTop: 2, fontWeight: '500' },

  scrollContent: { paddingHorizontal: 12, paddingVertical: 8 },
  headerComponentContainer: { paddingHorizontal: 4 },

  hubContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  hubCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: 12, padding: 10, marginHorizontal: 4, borderLeftWidth: 3, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#0f172a', shadowOpacity: 0.02, shadowRadius: 6, elevation: 1 },
  hubNumber: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  hubLabel: { fontSize: 10, color: '#475569', marginTop: 2, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    marginHorizontal: 4,
    shadowColor: '#0f172a',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  searchContainerFocused: {
    borderColor: '#0a7ea4',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#0f172a', fontSize: 13, height: '100%' },
  clearButton: { paddingLeft: 8, justifyContent: 'center' },
  cancelText: { color: '#0a7ea4', fontSize: 12, fontWeight: '600' },

  sectionHeader: { marginBottom: 10, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 1 },
  sectionSubtitle: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '500' },

  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 4 },
  lockerCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 12,
    marginBottom: 10,
    marginHorizontal: 4,
    justifyContent: 'space-between',
    minHeight: 125,
    shadowColor: '#0f172a',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  iconWrapper: { backgroundColor: '#f8fafc', padding: 5, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  iconWrapperLivre: { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' },
  badgeStatus: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5 },
  badgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.2 },
  lockerIdText: { fontSize: 20, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  userLabel: { fontSize: 11, color: '#475569', marginTop: 2, marginBottom: 8, fontWeight: '600', textTransform: 'capitalize' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 },
  footerActionText: { fontSize: 10, color: '#64748b', fontWeight: '600', letterSpacing: 0.1 },

  backButton: {
    marginRight: 15,
  },
  headerContainer: {
    justifyContent: 'center',
    minWidth: 150,
  },

  installButton: {
    height: 55,
    borderRadius: 12,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 20,
    marginHorizontal: 10,
    position: "absolute",
    right: 1
  },
  installIconCircle: { backgroundColor: '#e0f2fe', padding: 8, borderRadius: 50, marginBottom: 6 },

  fabTopo: {
    position: 'absolute',
    bottom: 20,
    marginBottom: 40,
    right: 20,
    backgroundColor: '#0a7ea4',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  }
});