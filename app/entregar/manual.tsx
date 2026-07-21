import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { FlashList as ShopifyFlashList } from '@shopify/flash-list';

// API de filiais
import { armariosFiliais } from '../../services/api';
import { getSelectedFilial } from '../../services/storage';

const FlashList = ShopifyFlashList as any;

type ArmarioGrupo = {
  id: number;
  tipo: string;
  filial: number;
  armariosUnidade: any[];
};

const { width } = Dimensions.get('window');
// Calcula o tamanho exato de cada coluna considerando os paddings laterais (16 * 2 = 32) e o espaço entre eles (12)
const CARD_WIDTH = (width - 32 - 12) / 2;

export default function EntregarManualScreen() {
  const router = useRouter();
  const [filial, setFilial] = useState<number | null>(null);
  const localParams = useLocalSearchParams();

  useEffect(() => {
    getSelectedFilial().then((f) => setFilial(f));
  }, []);

  const armariosQuery = useQuery({
    queryKey: ['armarios', filial],
    queryFn: async () => {
      if (filial === null) return [];
      const data = await armariosFiliais(filial);
      return Array.isArray(data) ? data : [];
    },
    enabled: filial !== null,
  });

  const grupos: ArmarioGrupo[] = armariosQuery.data ?? [];

  const handleSelectType = (tipo: string, armarioId: number) => {
    router.push({
      pathname: '/entregar/selectArmario',
      params: {
        tipoSelecionado: tipo,
        tipoDevolucao: 'entregar',
        armarioId: armarioId.toString(),
      },
    });
  };

  const formatarNomeTipo = (tipo: string) => {
    if (!tipo) return '';
    return tipo
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/(^\w{1})|(\s+\w{1})/g, (letter) => letter.toUpperCase());
  };

  const obterConfiguracaoPorTipo = (tipo: string) => {
    const lower = tipo?.toUpperCase();
    if (lower.includes('VESTIARIO_MASCULINO')) {
      return { icon: 'gender-male', color: '#0284c7', bgColor: '#e0f2fe' };
    }
    if (lower.includes('VESTIARIO_FEMININO')) {
      return { icon: 'gender-female', color: '#db2777', bgColor: '#fce7f3' };
    }
    if (lower.includes('FRIOS')) {
      return { icon: 'snowflake', color: '#2563eb', bgColor: '#dbeafe' };
    }
    if (lower.includes('SECOS')) {
      return { icon: 'package-variant-closed', color: '#b45309', bgColor: '#fef3c7' };
    }
    if (lower.includes('HORTIFRUTI')) {
      return { icon: 'food-apple-outline', color: '#16a34a', bgColor: '#dcfce7' };
    }
    return { icon: 'door-closed', color: '#475569', bgColor: '#f1f5f9' };
  };

  const renderGrupo = useCallback(({ item }: { item: ArmarioGrupo }) => {
    if (!item.tipo) return null;

    const config = obterConfiguracaoPorTipo(item.tipo);
    const hexId = `0x${(500 + item.id).toString(16).toUpperCase()}`;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.typeCard,
          { transform: [{ scale: pressed ? 0.98 : 1 }] }
        ]}
        onPress={() => handleSelectType(item.tipo, item.id)}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.iconWrapper, { backgroundColor: config.bgColor }]}>
            <MaterialCommunityIcons name={config.icon as any} size={20} color={config.color} />
          </View>
          <View style={styles.badgeId}>
            <Text style={styles.badgeText}>{hexId}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.typeCardText} numberOfLines={1}>
            {formatarNomeTipo(item.tipo)}
          </Text>
          <Text style={styles.cardSubtitle}>
            {item.armariosUnidade?.length ?? 0} unidades
          </Text>
        </View>

        <View style={styles.actionRow}>
          <Text style={[styles.actionText, { color: config.color }]}>Selecionar</Text>
          <Ionicons name="chevron-forward" size={12} color={config.color} />
        </View>
      </Pressable>
    );
  }, []);

  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </Pressable>
      </View>

      <FlashList
        data={grupos}
        renderItem={renderGrupo}
        keyExtractor={(item: ArmarioGrupo) => item.id.toString()}
        numColumns={2}
        estimatedItemSize={145}
        estimatedListSize={{ width: width, height: 600 }}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <View style={styles.header}>
            <Text style={styles.title}>Selecione o Bloco</Text>
            <Text style={styles.subtitle}>
              Escolha um dos módulos abaixo para prosseguir com a entrega controlada de chaves.
            </Text>
          </View>
        )}
        ListEmptyComponent={
          !armariosQuery.isLoading ? (
            <View style={styles.centerContainer}>
              <MaterialCommunityIcons name="cube-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyText}>Nenhum bloco operacional encontrado</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          armariosQuery.isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color="#0284c7" />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#ffffff' },
  topBar: { paddingHorizontal: 16, paddingTop: 52, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  
  header: { paddingHorizontal: 0, paddingTop: 12, paddingBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a', letterSpacing: -0.4 },
  subtitle: { color: '#64748b', fontSize: 13, marginTop: 4, fontWeight: '500', lineHeight: 18 },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100, gap: 8 },
  emptyText: { color: '#94a3b8', fontSize: 13, fontFamily: 'monospace', fontWeight: '600' },
  
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  columnWrapper: { 
    flexDirection: 'row',
    justifyContent: 'flex-start', // Garante que começam do canto esquerdo da tela
    gap: 12, // Força o espaçamento exato entre os dois elementos
  },
  
  typeCard: {
    width: CARD_WIDTH, // Define a largura calculada milimetricamente para a tela
    maxWidth: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
    minHeight: 140,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  iconWrapper: { padding: 8, borderRadius: 8 },
  
  badgeId: { backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: '#64748b', fontSize: 9, fontFamily: 'monospace', fontWeight: '700' },
  
  cardContent: { marginTop: 10, width: '100%' },
  typeCardText: { fontSize: 14, fontWeight: '700', color: '#0f172a', letterSpacing: -0.2 },
  cardSubtitle: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 10 },
  actionText: { fontSize: 11, fontWeight: '700' },
});