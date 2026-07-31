import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList as ShopifyFlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { armOcupadoApi } from '../../services/api';

const FlashList = ShopifyFlashList as any;

interface ArmarioInfo {
  amarioId: number;
  tipo: string;
  chave: number;
  status: 'OCUPADO';
}

interface RegistroOcupado {
  nomeColaborador: string;
  matriculaColaborador: string;
  setor: string;
  dataHoraRetirada: string | null;
  dataHoraDevolucao: string | null;
  filialId: number;
  disponivel: boolean;
  armario: ArmarioInfo;
}

const { width } = Dimensions.get('window');

export default function ArmariosOcupadosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Pega o espaço exato da barra de status
  const { filial, armarioId, numero } = useLocalSearchParams<{ filial: string; armarioId: string, numero: any }>();
  
  const [busca, setBusca] = useState('');
  const [estaPesquisando, setEstaPesquisando] = useState(false);
  
  const listRef = useRef<any>(null);
  const [mostrarBotaoTopo, setMostrarBotaoTopo] = useState(false);

  const { data: ocupadosData = [], isLoading, error } = useQuery<RegistroOcupado[]>({
    queryKey: ['ArmariosOcupados', filial, armarioId],
    queryFn: () => armOcupadoApi(Number(filial), Number(armarioId)),
    enabled: !!filial && !!armarioId,
    staleTime: 10000, 
    refetchInterval: 15000,
  });

  const dadosFiltrados = useMemo(() => {
    let resultado = Array.isArray(ocupadosData) ? [...ocupadosData] : [];

    if (busca.trim() !== '') {
      const termo = busca.trim().toLowerCase();
      resultado = resultado.filter((item) => 
        String(item.armario?.chave).includes(termo) ||
        item.nomeColaborador?.toLowerCase().includes(termo) ||
        item.matriculaColaborador?.includes(termo)
      );
    }

    return resultado.sort((a, b) => (a.armario?.chave || 0) - (b.armario?.chave || 0));
  }, [ocupadosData, busca]);

  const irParaDetalhes = useCallback((item: RegistroOcupado) => {
    router.push({
      pathname: '/armarios/detalhes' as any,
      params: {
        id: String(item.armario?.amarioId),
        numero: `${item.armario?.chave}`,
        status: 'ocupado',
        usuario: item.nomeColaborador,
        matricula: item.matriculaColaborador,
        setor: item.setor,
        filial: String(filial),
        armarioId: item.armario?.amarioId
      },
    });
  }, [router, filial]);

  const renderOcupadoItem = useCallback(({ item }: { item: RegistroOcupado }) => {
    const tipoFmt = item.armario?.tipo ? item.armario.tipo.replace('_', ' ') : '';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => irParaDetalhes(item)}
        activeOpacity={0.85}
      >
        <View style={styles.leftSection}>
          <View style={styles.chaveBadge}>
            <Text style={styles.chaveLabel}>Nº</Text>
            <Text style={styles.chaveNumero}>{item.armario?.chave}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.colaboradorNome} numberOfLines={1}>
            {item.nomeColaborador}
          </Text>
          
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Matrícula: {item.matriculaColaborador}</Text>
            <View style={styles.dotDivider} />
            <Text style={styles.metaText} numberOfLines={1}>{item.setor}</Text>
          </View>

          <Text style={styles.tipoText}>{tipoFmt}</Text>
        </View>

        <View style={styles.rightSection}>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#94a3b8" />
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
    setMostrarBotaoTopo(offsetY > 300);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.loadingText}>Buscando armários ocupados...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#b91c1c" />
        <Text style={styles.errorText}>Erro ao carregar ocupações da API.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#f0f9ff' },
          headerTintColor: '#0f172a',
          headerTitleAlign: 'left',
          headerShadowVisible: false,
          
          // Joga o botão de voltar para baixo da notificação
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={[styles.backButton, { marginTop: insets.top }]}
            >
              <Ionicons name="arrow-back" size={22} color="#0f172a" />
            </TouchableOpacity>
          ),

          // Joga o título para baixo da barra de notificações
          headerTitle: () => (
            <View style={[styles.headerContainer, { marginTop: insets.top }]}>
              <Text style={styles.headerTitle}>Armários Ocupados</Text>
              <Text style={styles.headerSubtitle}>Bloco {armarioId} • Filial {filial}</Text>
            </View>
          ),
        }}
      />

      <FlashList
        ref={listRef}
        data={dadosFiltrados}
        renderItem={renderOcupadoItem}
        keyExtractor={(item: RegistroOcupado) => `${item.armario?.amarioId}-${item.armario?.chave}-${item.matriculaColaborador}`}
        estimatedItemSize={95}
        estimatedListSize={{ width: width, height: 600 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={lidarComScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={(
          <View style={styles.headerComponentContainer}>
            <View style={[styles.searchContainer, estaPesquisando && styles.searchContainerFocused]}>
              <Ionicons name="search" size={20} color={estaPesquisando ? "#0a7ea4" : "#64748b"} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por armário, nome ou matrícula..."
                placeholderTextColor="#64748b"
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

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {estaPesquisando ? "Resultados Filtrados" : "Listagem de Chaves Retidas"}
              </Text>
              <Text style={styles.sectionSubtitle}>{dadosFiltrados.length} chaves ocupadas encontradas</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.center}>
            <MaterialCommunityIcons name="lock-open-outline" size={40} color="#64748b" />
            <Text style={[styles.loadingText, { marginTop: 8 }]}>Nenhum armário ocupado nesta busca.</Text>
          </View>
        )}
      />

      {mostrarBotaoTopo && (
        <TouchableOpacity
          style={styles.fabTopo}
          onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f9ff' },
  center: { justifyContent: 'center', alignItems: 'center', paddingVertical: 48 },
  loadingText: { color: '#64748b', marginTop: 12, fontSize: 14, textAlign: 'center' },
  errorText: { color: '#b91c1c', marginTop: 12, fontSize: 14, fontWeight: '600' },
  
  backButton: { marginRight: 15 },
  headerContainer: { justifyContent: 'center' },
  headerTitle: { color: '#0f172a', fontSize: 18, fontWeight: '800' },
  headerSubtitle: { color: '#475569', fontSize: 13, marginTop: 2, fontWeight: '500' },
  
  scrollContent: { paddingHorizontal: 12, paddingVertical: 12 },
  headerComponentContainer: { paddingHorizontal: 4 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  searchContainerFocused: {
    borderColor: '#0a7ea4',
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#0f172a', fontSize: 14, height: '100%' },
  clearButton: { paddingLeft: 10, justifyContent: 'center' },
  cancelText: { color: '#0a7ea4', fontSize: 13, fontWeight: '600' },

  sectionHeader: { marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 1 },
  sectionSubtitle: { fontSize: 12, color: '#64748b', marginTop: 3, fontWeight: '500' },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  leftSection: {
    marginRight: 14,
  },
  chaveBadge: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: 'rgba(185, 28, 28, 0.2)',
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chaveLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b91c1c',
    textTransform: 'uppercase',
  },
  chaveNumero: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: -2,
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  colaboradorNome: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  dotDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 8,
  },
  tipoText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  rightSection: {
    paddingLeft: 8,
  },
  fabTopo: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#0a7ea4',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});