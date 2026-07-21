import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList as ShopifyFlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
// API de busca de bloco único
import { getUserId } from '@/services/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buscaBlocoArmario, devolverChave } from '../../services/api';
const FlashList = ShopifyFlashList as any;
type ArmarioItem = {
  amarioId: number; 
  chave: number;    
  status: string;
  tipo: string;
};
const { width } = Dimensions.get('window');
export default function SelectArmarioScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ tipoDevolucao?: string }>();
  
  // Identifica se estamos no modo de devolução
  const isDevolucao = params.tipoDevolucao === "devolucao";

  const [selectedArmario, setSelectedArmario] = useState<ArmarioItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const [selectedArm, setSelectedArm] = useState<any | null>(null);
  const [isStorageLoading, setIsStorageLoading] = useState(true);

  useEffect(() => {
   navigation.setOptions({
      title: '',
    });
    const loadData = async () => {
      try {
        const data = await AsyncStorage.getItem("selectedArm");
        if (data) setSelectedArm(JSON.parse(data));
      } finally {
        setIsStorageLoading(false);
      }
    };
    loadData();
  }, [navigation]);

  const armariosQuery = useQuery({
    queryKey: ['armariosUnicoS', selectedArm, selectedArm?.tipo],
    enabled: !isStorageLoading && Boolean(selectedArm && selectedArm?.tipo),
    queryFn: async () => {
      const data = await buscaBlocoArmario(Number(selectedArm?.armarioId as any), selectedArm?.tipo);
      
      let listaArmarios: any[] = [];
      if (Array.isArray(data)) listaArmarios = data;
      else if (Array.isArray(data?.bloco)) listaArmarios = data.bloco;
      else if (Array.isArray(data?.blocoChaves)) listaArmarios = data.blocoChaves;
      else if (Array.isArray(data?.armarios)) listaArmarios = data.armarios;

      return listaArmarios.map((item: any) => ({
        amarioId: Number(item.amarioId),
        chave: Number(item.chave),
        status: item.status ?? 'LIVRE',
        tipo: item.tipo ?? selectedArm?.tipo,
        originalData: data
      })).sort((a, b) => a.chave - b.chave);
    },
  });

  const armarios = armariosQuery.data ?? [];
  const [userId, setUserId] = useState<any>();

  // Filtro adaptativo baseando-se no modo de devolução (OCUPADO vs LIVRE)
  const availableAndFiltered = useMemo(() => {
    return armarios.filter((a) => {
      if (!a) return false;
      
      // Se for devolução, exibe apenas os OCUPADOS; caso contrário, exibe os LIVRES
      const atendeStatus = isDevolucao 
        ? (a.status === 'OCUPADO' || a.status === 'EM_USO' || a.status !== 'LIVRE') 
        : (a.status === 'LIVRE');

      const correspondeBusca = searchQuery 
        ? String(a.chave).includes(searchQuery.trim()) 
        : true;

      return atendeStatus && correspondeBusca;
    });
  }, [armarios, searchQuery, isDevolucao]);

  const handleNextStep = async () => {
    if (isDevolucao) {
      if (!selectedArmario) {
        Alert.alert('Atenção', 'Por favor, selecione um armário para devolver.');
        return;
      }
      try {
        const payload = {
          usuarioId: Number(userId),
          item: { arm: selectedArmario?.amarioId, chave: selectedArmario?.chave.toString() },
        };
        await devolverChave(payload);
        Alert.alert('Sucesso', `Chave ${selectedArmario.chave} devolvida com sucesso!`);
        router.back();
      } catch (error: any) {
        Alert.alert('Erro', error?.message || 'Falha ao processar devolução.');
      }
      return;
    } else {
      if (!selectedArmario) {
        Alert.alert('Atenção', 'Por favor, selecione um armário para continuar.');
        return;
      }
      router.push({
        pathname: '/entregar/detalhesFacialItens',
        params: {
          armarioId: selectedArmario.amarioId as any,
          numeroDaChave: selectedArmario.chave.toString(),
        },
      });
    }
  };

  useEffect(() => {
    async function carregarUsuario() {
      try {
        const idSalvo = await getUserId();
        if (idSalvo) setUserId(idSalvo);
      } catch (e) {
        console.log('Erro ao recuperar userId');
      }
    }
    carregarUsuario();
  }, []);

  const renderArmario = useCallback(({ item }: { item: ArmarioItem }) => {
    const isSelected = selectedArmario?.amarioId === item.amarioId && selectedArmario?.chave === item.chave;

    return (
      <Pressable
        style={[
          styles.armarioCard,
          isSelected && styles.selectedCard,
        ]}
        onPress={() => setSelectedArmario(item)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrapper, isSelected && styles.iconWrapperSelected]}>
            <MaterialCommunityIcons 
              name="locker" 
              size={20} 
              color={isSelected ? '#0EA5E9' : '#94A3B8'} 
            />
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={22} color="#0EA5E9" />
          )}
        </View>

        <View style={styles.armarioContent}>
          <Text style={styles.armarioNumber}>Nº {item.chave}</Text>
          <Text style={styles.armarioType} numberOfLines={1}>
            {item.tipo.replace('_', ' ')}
          </Text>
        </View>

        <View style={[
          styles.badgeStatus, 
          isDevolucao ? styles.badgeOccupiedBg : styles.badgeFreeBg
        ]}>
          <Text style={isDevolucao ? styles.statusOccupied : styles.statusFree}>
            {isDevolucao ? 'Ocupado' : 'Disponível'}
          </Text>
        </View>
      </Pressable>
    );
  }, [selectedArmario, isDevolucao]);

  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="##0F172A" />
        </Pressable>
      </View> 

      <FlashList
        data={availableAndFiltered}
        renderItem={renderArmario}
        keyExtractor={(item: ArmarioItem) => `${item.amarioId}-${item.chave}`}
        numColumns={2}
        estimatedItemSize={150}
        estimatedListSize={{ width: width, height: 500 }}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <View style={styles.headerContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {isDevolucao ? 'Devolução de Chave' : 'Selecione o Armário'}
              </Text>
              <Text style={styles.subtitle}>
                {selectedArm?.tipo 
                  ? `Bloco ativo • ${selectedArm?.tipo.replace('_', ' ')}` 
                  : (isDevolucao ? 'Qual armário será devolvido?' : 'Qual armário será entregue?')}
              </Text>
            </View>

            <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
              <Ionicons name="search-outline" size={20} color={isFocused ? "#0EA5E9" : "#64748B"} style={styles.searchIconBar} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar pelo número do armário..."
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={searchQuery}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (text.trim() !== '') {
                    const exato = availableAndFiltered.find(a => String(a.chave) === text.trim());
                    if (exato) setSelectedArmario(exato);
                  } else {
                    setSelectedArmario(null);
                  }
                }}
               />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#64748B" />
                </Pressable>
              )}
            </View>

            <View style={styles.metaInfoRow}>
              <View style={[styles.indicatorDot, isDevolucao && { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.info}>
                {availableAndFiltered.length} armários {isDevolucao ? 'ocupados' : 'livres'} encontrados
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !armariosQuery.isLoading ? (
            <View style={styles.centerContainer}>
              <MaterialCommunityIcons name="locker" size={48} color="#334155" />
              <Text style={styles.emptyText}>
                {isDevolucao ? 'Nenhum armário ocupado neste bloco' : 'Nenhum armário livre neste bloco'}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          armariosQuery.isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#0EA5E9" />
            </View>
          ) : null
        }
      />

      <View style={styles.footer}>
        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, !selectedArmario && styles.disabledButton]}
          onPress={handleNextStep}
          disabled={!selectedArmario}
        >
          <Text style={styles.buttonText}>Confirmar e Avançar</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },
  headerContainer: {
    paddingBottom: 18,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0F172A',
  },

  subtitle: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
  },

  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },

  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    marginRight: 8,
  },

  info: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 56,

    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  searchContainerFocused: {
    borderColor: '#0EA5E9',
  },

  searchIconBar: {
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
  },

  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },

  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 30,
  },

  columnWrapper: {
    justifyContent: 'space-between',
  },

  armarioCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 6,
    marginBottom: 14,
    padding: 10,
    minHeight: 150,

    borderWidth: 1,
    borderColor: '#E2E8F0',

    elevation: 5,

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    justifyContent: 'space-between',
  },

  selectedCard: {
    borderColor: '#0284C7',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
    transform: [{ scale: 1.03 }],
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconWrapperSelected: {
    backgroundColor: '#DBEAFE',
  },

  armarioContent: {
    alignItems: 'center',
    marginVertical: 12,
  },

  armarioNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
  },

  armarioType: {
    marginTop: 5,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  badgeStatus: {
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderRadius: 30,
  },

  badgeFreeBg: {
    backgroundColor: '#DCFCE7',
  },

  badgeOccupiedBg: {
    backgroundColor: '#FEF3C7',
  },

  statusFree: {
    color: '#15803D',
    fontWeight: '800',
    fontSize: 12,
  },

  statusOccupied: {
    color: '#D97706',
    fontWeight: '800',
    fontSize: 12,
  },

  emptyText: {
    marginTop: 15,
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },

  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },

  cancelButton: {
    flex: 0.4,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionButton: {
    flex: 0.6,
    backgroundColor: '#0284C7',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  disabledButton: {
    opacity: 0.45,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },

  cancelText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 15,
  },
});