import { descriptogradaToken } from '@/services/jwt';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert, Animated, Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { ArmariodTop3UltimosEntregue, setOnSessionExpired } from '../../services/api';
import { showError } from '../../services/toast';

const actions = [
  {
    label: 'Entregar Chave',
    color: '#DBEAFE',
    textColor: '#1D4ED8',
    icon: 'key-plus',
    rota: 'entregar',
    permissoesExigidas: ['REGISTRAR_ENTRADA'],
  },
  {
    label: 'Receber Chave',
    color: '#DCFCE7',
    textColor: '#15803D',
    icon: 'key-minus',
    rota: 'receber',
    permissoesExigidas: ['REGISTRAR_SAIDA'],
  },
  {
    label: 'Chaves em Uso',
    color: '#FEF3C7',
    textColor: '#B45309',
    icon: 'clipboard-text-outline',
    rota: 'chaves-em-uso',
    permissoesExigidas: ['VISUALIZAR_REGISTRO'],
  },
  {
    label: 'Armários',
    color: '#EDE9FE',
    textColor: '#6D28D9',
    icon: 'office-building-outline',
    rota: 'filiais-armarios',
    permissoesExigidas: ['VISUALIZAR_VISITANTES'],
  },
  {
    label: 'Colaborador',
    color: '#FCE7F3',
    textColor: '#BE185D',
    icon: 'account-outline',
    rota: 'consumer',
    permissoesExigidas: ['REGISTRO_CRIADO'],
  },
  {
    label: 'Totem',
    color: '#CCFBF1',
    textColor: '#0F766E',
    icon: 'monitor-cellphone',
    rota: 'totem',
    permissoesExigidas: ['REGISTRAR_ENTRADA'],
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [filialNum, setFilialNum] = useState<number | null>(null);
  const [selectedArm, setSelectedArm] = useState<any>(null);
  const [permissao, setPermissao] = useState<string[]>([]);
  const [horaHeader, setHoraHeader] = useState("");

  const dataHeader = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).toUpperCase();

  const buscaData = () => {
    const data = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setHoraHeader(data);
  };

  useEffect(() => {
    const interval = setInterval(buscaData, 1000);
    return () => clearInterval(interval);
  }, []);

  // Monitor de expiração de sessão com redirecionamento seguro para o login
  useEffect(() => {
    setOnSessionExpired(async () => {
      try {
        await AsyncStorage.removeItem("authToken");
        await AsyncStorage.removeItem("selectedFilial");
        await AsyncStorage.removeItem("selectedArm");
      } catch (e) {
        console.error('Erro ao limpar storage na expiração:', e);
      }

      showError('Sessão expirada', 'Faça login novamente');
      
      // Utiliza router.replace para garantir compatibilidade com o Expo Router
      router.replace('/login');
    });
  }, [router]);

  // Resgate seguro da filial do Storage e Token
  useEffect(() => {
    async function inicializarDados() {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          router.replace('/login');
          return;
        }

        const payload = await descriptogradaToken();
        if (!payload) {
          router.replace('/login');
          return;
        }

        if (Array.isArray(payload?.permissoes)) {
          setPermissao(payload.permissoes);
        }

        const idSalvo = await AsyncStorage.getItem('selectedFilial');
        if (!idSalvo || idSalvo.trim() === '') {
          router.replace('/filial');
          return;
        }
        const parsedId = parseInt(idSalvo);
        if (isNaN(parsedId)) {
          router.replace('/filial');
          return;
        }
        setFilialNum(parsedId);

        const dataArm = await AsyncStorage.getItem("selectedArm");
        if (dataArm) {
          setSelectedArm(JSON.parse(dataArm));
        }
      } catch (err) {
        console.error('Erro ao ler AsyncStorage/Token na Home:', err);
        router.replace('/login');
      }
    }

    inicializarDados();
  }, [router]);

  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.4,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scale]);

  const temPermissao = (permissoesExigidas: string[] = []) => {
    if (!permissao || permissao.length === 0) return false;
    return permissoesExigidas.every(p => permissao.includes(p));
  };

  const { data: armario = [] } = useQuery<any[]>({
    queryKey: ['Top3UltimosFilial', filialNum],
    queryFn: () => ArmariodTop3UltimosEntregue(116),
    enabled: !!filialNum,
    staleTime: 10000,
  });

  const handleActionPress = (action: any) => {
    if (!temPermissao(action.permissoesExigidas)) {
      Alert.alert('Acesso Negado', 'Você não possui permissão para executar esta ação.');
      return;
    }

    const rota = action.rota;
    if (rota === 'entregar') return router.push('/entregar');
    if (rota === 'consumer') return router.push('/consumer/ListUsersScreen');
    if (rota === "filiais-armarios") {
      return router.push({
        pathname: "/armarios/ArmariosScreen",
        params: {
          armarioId: selectedArm?.armarioId,
          tipo: selectedArm?.tipo,
          filial: selectedArm?.filial,
        },
      });
    }

    if (rota === 'receber') return router.push('/entregar/devolucao' as any);
    if (rota === 'totem') return router.push('/entregar/entregarToten' as any);
    if (rota === 'chaves-em-uso') {
      return router.push({
        pathname: "/armarios/ocupados",
        params: {
          armarioId: selectedArm?.armarioId,
          tipo: selectedArm?.tipo,
          filial: selectedArm?.filial,
        },
      });
    }
    Alert.alert(rota, 'Funcionalidade em breve.');
  };

  if (filialNum === null) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f9ff' }]}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>Controle de Chaves</Text>
            <Text style={styles.headerSubtitle}>Portaria Principal • Filial {filialNum}</Text>
          </View>
        </View>

        <View style={styles.headerTimeContainer}>
          <Text style={styles.headerTime}>{horaHeader}</Text>
          <Text style={styles.headerDate}>{dataHeader}</Text>
        </View>
      </View>

      <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>AÇÕES RÁPIDAS</Text>

        <View style={styles.mainActionsRow}>
          {actions.slice(0, 2).map((action) => {
            const autorizado = temPermissao(action.permissoesExigidas);

            return (
              <Fragment key={action.label}>
                {autorizado && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.mainActionCard,
                      { backgroundColor: action.color, opacity: pressed ? 0.85 : 1 },
                    ]}
                    onPress={() => handleActionPress(action)}
                  >
                    <MaterialCommunityIcons
                      name={action.icon as any}
                      size={26}
                      color={action.textColor}
                      style={{ marginBottom: 6 }}
                    />
                    <Text style={[styles.actionText, { color: action.textColor }]}>{action.label}</Text>
                  </Pressable>
                )}
              </Fragment>
            );
          })}
        </View>

        <ScrollView style={{ padding: 5 }}>
          <View style={styles.secondaryActionsRow}>
            {actions.slice(2).map((action) => {
              const autorizado = temPermissao(action.permissoesExigidas);

              return (
                <View key={action.label} style={{ flex: 1 }}>
                  {autorizado && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.secondaryActionCard,
                        { backgroundColor: action.color, opacity: pressed ? 0.85 : 1 },
                      ]}
                      onPress={() => handleActionPress(action)}
                    >
                      <MaterialCommunityIcons
                        name={action.icon as any}
                        size={18}
                        color={action.textColor}
                        style={{ marginBottom: 4 }}
                      />
                      <Text style={[styles.secondaryActionText, { color: action.textColor }]}>{action.label}</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.alertCard}>
          <MaterialCommunityIcons name="alert-circle-outline" size={15} color="#b45309" style={{ marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertDescription}>
              Chaves retiradas há mais de 8h necessitam de verificação imediata.
            </Text>
          </View>
        </View>

        <View style={styles.liveSectionHeader}>
          <View style={styles.liveBadge}>
            <Animated.View
              style={[
                styles.pulseDot,
                {
                  transform: [{ scale }],
                  opacity: scale.interpolate({
                    inputRange: [1, 1.5],
                    outputRange: [1, 0.5],
                  }),
                },
              ]}
            />
            <Text style={styles.liveText}>LIVE MONITOR</Text>
          </View>

          <Text style={styles.techSerialHeader}>
            RECV_STREAM: ACTIVE
          </Text>
        </View>

        {armario.length === 0 ? (
          <View style={styles.emptyTechCard}>
            <Text style={styles.emptyTechText}>[ NO LIVE DATA SEQUENCE DETECTED ]</Text>
          </View>
        ) : (
          armario.map((item, index) => {
            const hexId = `0x${(1024 + (item?.armario?.id || index)).toString(16).toUpperCase()}`;
            return (
              <View style={styles.techLogCard} key={index}>
                <View style={styles.techCardTop}>
                  <View style={styles.techTagGroup}>
                    <View style={styles.hexIdBadge}>
                      <Text style={styles.hexIdText}>{hexId}</Text>
                    </View>
                    <View style={styles.techTypeBadge}>
                      <Text style={styles.techTypeText}>
                        {item?.armario?.tipo?.replace('_', ' ')?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.techTimeTicker}>
                    {new Date(item?.dataHoraRetirada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                <View style={styles.techCardBody}>
                  <View style={styles.techIconWrapper}>
                    <MaterialCommunityIcons name="swap-horizontal" size={14} color="#0284c7" />
                  </View>
                  <View style={styles.techTextWrapper}>
                    <Text style={styles.techMainText} numberOfLines={1}>
                      <Text style={styles.techUser}>{item?.nomeColaborador}</Text>
                      <Text style={styles.techAction}> RETIROU CHAVE </Text>
                      <Text style={styles.techKey}>[{item?.armario?.chave}]</Text>
                    </Text>
                  </View>
                </View>

                <View style={styles.techCardFooter}>
                  <View style={styles.verifiedBadge}>
                    <MaterialCommunityIcons name="check-circle" size={11} color="#16a34a" />
                    <Text style={styles.verifiedText}>LOG_SECURE_SYNC</Text>
                  </View>
                  <Text style={styles.techMicroSerial}>SYS_NODE_PRT_{index}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { backgroundColor: '#ffffff', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', letterSpacing: -0.3 },
  headerSubtitle: { color: '#64748b', fontSize: 12, marginTop: 2, fontWeight: '500' },
  headerTimeContainer: { marginTop: 12, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  headerTime: { color: '#0f172a', fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  headerDate: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  page: { flex: 1 },
  content: { padding: 14, paddingBottom: 40 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#64748b', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 16, marginBottom: 10, paddingHorizontal: 2 },
  mainActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10
  },
  mainActionCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },
  actionText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  secondaryActionsRow: { flexDirection: 'row', gap: 8 },
  secondaryActionCard: {
    flex: 1,
    borderRadius: 12,
    padding: 8,
    height: 85,
    justifyContent: 'center',
    alignItems: 'center', 
    shadowColor: '#000', 
    elevation: 5
  },
  secondaryActionText: { fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 2 },
  alertCard: { backgroundColor: '#fffbeb', borderRadius: 12, padding: 10, marginTop: 16, borderWidth: 1, borderColor: '#fef3c7', flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  alertDescription: { color: '#b45309', fontSize: 11, lineHeight: 15, fontWeight: '500' },
  liveSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10, paddingHorizontal: 2 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, gap: 5 },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  liveText: { fontSize: 9, fontWeight: '900', color: '#b91c1c', letterSpacing: 0.5 },
  techSerialHeader: { fontSize: 9, fontWeight: '700', color: '#94a3b8', fontFamily: 'monospace' },
  techLogCard: { backgroundColor: '#ffffff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 3, borderLeftColor: '#0284c7', marginBottom: 6 },
  techCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  techTagGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hexIdBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 4 },
  hexIdText: { fontSize: 9, fontFamily: 'monospace', fontWeight: '700', color: '#475569' },
  techTypeBadge: { backgroundColor: '#e0f2fe', paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 4 },
  techTypeText: { fontSize: 8, fontWeight: '800', color: '#0369a1' },
  techTimeTicker: { fontSize: 10, fontWeight: '700', color: '#64748b' },
  techCardBody: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  techIconWrapper: { width: 22, height: 22, borderRadius: 6, backgroundColor: '#f0f9ff', justifyContent: 'center', alignItems: 'center' },
  techTextWrapper: { flex: 1 },
  techMainText: { fontSize: 12, color: '#334155' },
  techUser: { fontWeight: '700', color: '#0f172a' },
  techAction: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  techKey: { fontWeight: '800', color: '#0284c7', fontFamily: 'monospace' },
  techCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f8fafc', paddingTop: 5 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  verifiedText: { fontSize: 8, fontWeight: '800', color: '#16a34a', letterSpacing: 0.2 },
  techMicroSerial: { fontSize: 8, fontFamily: 'monospace', color: '#cbd5e1' },
  emptyTechCard: { backgroundColor: '#ffffff', borderRadius: 10, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  emptyTechText: { color: '#94a3b8', fontSize: 10, fontFamily: 'monospace' },
});