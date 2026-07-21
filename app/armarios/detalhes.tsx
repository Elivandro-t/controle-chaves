import { detalhesArmario, devolverChave } from '@/services/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { getUserId } from '../../services/storage';

export default function DetalhesArmarioScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('2');
  const [processandoDevolucao, setProcessandoDevolucao] = useState(false);

  // Mantida a desestruturação alinhada com os tipos originais
  const { numero, usuario, armarioId, filial } = useLocalSearchParams<{
    numero: string;
    usuario?: string;
    armarioId: string;
    filial: string;
  }>();

  useEffect(() => {
    async function carregarUsuario() {
      try {
        const idSalvo = await getUserId();
        if (idSalvo) setUserId(idSalvo);
      } catch (e) {
        console.log('Erro ao recuperar userId, usando default 2');
      }
    }
    carregarUsuario();
  }, []);

  const armarioIdNumero = React.useMemo(() => {
    if (!armarioId) return null;
    return Array.isArray(armarioId) ? Number(armarioId[0]) : Number(armarioId);
  }, [armarioId]);

  const { data, isLoading } = useQuery({
    queryKey: ['detalhesArmario', numero, armarioIdNumero, filial],
    queryFn: () => detalhesArmario(Number(filial), Number(armarioIdNumero), numero),
    enabled: !!numero && !!armarioIdNumero && !!filial,
  });
  console.log(data)
  async function handleDevolverChave() {
    console.log("data " + armarioId + " " + numero)
    if (!armarioId || !numero) {
      Alert.alert('Atenção', 'Dados do armário insuficientes para prosseguir.');
      return;
    }

    // Popup de confirmação para liberação da chave
    Alert.alert(
      'Liberar Chave',
      'Deseja realmente liberar a chave do colaborador?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Sim',
          style: 'default',
          onPress: async () => {
            setProcessandoDevolucao(true);
            try {
              const payload = {
                usuarioId: Number(userId),
                item: {
                  chave: numero,
                  arm: Number(armarioIdNumero || 0)
                },
              };

              console.log("itens faltando +" + JSON.stringify(payload))

              const response = await devolverChave(payload);

              if (response) {
                Alert.alert('Sucesso', 'Chave devolvida com sucesso!');
                // Redirecionamento para a rota solicitada
                router.replace('/armarios/ocupados');
              }
            } catch (error: any) {
              console.log('Erro ao devolver chave:', error);
              Alert.alert('Erro', error?.message || 'Não foi possível processar a devolução.');
            } finally {
              setProcessandoDevolucao(false);
            }
          }
        }
      ],
      { cancelable: true }
    );
  }
 const handleEntregaChave = ()=>{
              router.push({
        pathname: '/entregar/selectConsumer',
        params: {
          armarioId: Number(armarioIdNumero || 0),
          numeroDaChave: numero,
          tipoSelecionado:"entregaManual"
        },
      });
 }
  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  const disponivel = data?.disponivel === true;
  const corStatus = disponivel ? '#15803d' : '#b91c1c';
  const bgBadge = disponivel ? '#e8f5e9' : '#fee2e2';
  const textoBadge = disponivel ? 'DISPONÍVEL' : 'OCUPADO';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: '#f0f9ff' },
          headerTintColor: '#0f172a',
          headerTitleAlign: 'left',
          headerTitle: 'Detalhes do Armário',
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
              <Ionicons name="arrow-back" size={24} color="#0f172a" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* CARD PRINCIPAL */}
        <View style={[styles.mainCard, { borderColor: disponivel ? '#bae6fd' : 'rgba(185, 28, 28, 0.2)' }]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.hardwareIconWrapper, { backgroundColor: corStatus + '15' }]}>
              <MaterialCommunityIcons
                name={disponivel ? "lock-open-outline" : "lock-outline"}
                size={28}
                color={corStatus}
              />
            </View>

            <View style={styles.titleWrapper}>
              <Text style={styles.mainTitle}>Armário {data?.armario?.chave || numero}</Text>
              <Text style={styles.subtitle}>{data?.armario?.tipo ? data.armario.tipo.replace('_', ' ') : 'NÃO ESPECIFICADO'}</Text>
              <Text style={styles.locationText}>{data?.armario?.filial || `Filial: ${filial}`}</Text>
            </View>
          </View>

          <View style={[styles.badgeStatus, { backgroundColor: bgBadge }]}>
            <View style={[styles.statusDot, { backgroundColor: corStatus }]} />
            <Text style={[styles.badgeText, { color: corStatus }]}>{textoBadge}</Text>
          </View>
        </View>

        {/* SEÇÃO DE INFORMAÇÕES DE USO */}
        <Text style={styles.sectionHeader}>INFORMAÇÕES DE USO</Text>

        {!disponivel ? (
          <View style={styles.colaboradorCard}>
            {/* HEADER DO CRACHÁ */}
            <View style={styles.colaboradorHeader}>
              <View style={styles.avatarContainer}>
                <MaterialCommunityIcons name="account-circle" size={32} color="#0a7ea4" />
                <View style={styles.onlineBadge} />
              </View>
              <View style={styles.colaboradorHeaderTitle}>
                <Text style={styles.colaboradorLabel}>COLABORADOR RESPONSÁVEL</Text>
                <Text style={styles.colaboradorName} numberOfLines={1}>
                  {data?.nomeColaborador}
                </Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* GRID DE INFORMAÇÕES */}
            <View style={styles.infoGrid}>
              <View style={styles.gridItem}>
                <View style={styles.iconLabelRow}>
                  <MaterialCommunityIcons name="badge-account-horizontal-outline" size={16} color="#64748b" />
                  <Text style={styles.gridLabel}>MATRÍCULA</Text>
                </View>
                <Text style={styles.gridValueHighlight}>{data?.matriculaColaborador || '---'}</Text>
              </View>

              <View style={styles.gridItem}>
                <View style={styles.iconLabelRow}>
                  <MaterialCommunityIcons name="office-building-marker-outline" size={16} color="#64748b" />
                  <Text style={styles.gridLabel}>SETOR / ÁREA</Text>
                </View>
                <Text style={styles.gridValue}>{data?.setor || '---'}</Text>
              </View>
            </View>

            {/* FOOTER AUDITORIA */}
            <View style={styles.colaboradorFooter}>
              <View style={styles.footerLeft}>
                <MaterialCommunityIcons name="shield-check" size={14} color="#15803d" />
                <Text style={styles.footerOperatorText}>
                  Operador: <Text style={styles.operatorName}>{'Sistema'}</Text>
                </Text>
              </View>
              <Text style={styles.secureBadge}>SISTEMA SEGURO</Text>
            </View>
          </View>
        ) : (
          /* ESTADO VAZIO PREMIUM */
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="key-link" size={28} color="#15803d" />
            </View>
            <Text style={styles.emptyStateTitle}>Armário Disponível</Text>
            <Text style={styles.emptyStateSubtext}>
              Nenhum colaborador alocado. A chave está pronta para ser retirada ou vinculada a um novo registro na portaria.
            </Text>
          </View>
        )}
         {
          disponivel &&
            <TouchableOpacity
            style={styles.btnDevolver}
            onPress={()=>{
              Alert.alert('Devolver Chave', 
              'Deseja realmente entregar a chave do armário?', 
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sim', onPress:handleEntregaChave }
              ]
            )
            }}
            disabled={!disponivel}
            activeOpacity={0.8}
          >
            {!disponivel ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <MaterialCommunityIcons name="lock-reset" size={22} color="#ffffff" />
                <Text style={styles.btnDevolverText}>Entregar CHAVE</Text>
              </>
            )}
          </TouchableOpacity>
         }
        {/* Botão de Devolução Direto (Visível somente se ocupado) */}
        {!disponivel && (
          <TouchableOpacity
            style={styles.btnDevolver}
            onPress={handleDevolverChave}
            disabled={processandoDevolucao}
            activeOpacity={0.8}
          >
            {processandoDevolucao ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <MaterialCommunityIcons name="lock-reset" size={22} color="#ffffff" />
                <Text style={styles.btnDevolverText}>DEVOLVER CHAVE</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* LOGO DE ASSINATURA INFERIOR */}
        <View style={styles.footerLogoContainer}>
          <MaterialCommunityIcons name="security-network" size={36} color="#94a3b8" />
          <Text style={styles.footerLogoText}>CONTROLE DE PORTARIA</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hardwareIconWrapper: {
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  titleWrapper: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  badgeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 1.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  colaboradorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  colaboradorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    backgroundColor: 'rgba(10, 126, 164, 0.08)',
    padding: 10,
    borderRadius: 12,
    marginRight: 14,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#15803d',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  colaboradorHeaderTitle: {
    flex: 1,
  },
  colaboradorLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  colaboradorName: {
    fontSize: 18,
    color: '#0f172a',
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridItem: {
    flex: 1,
  },
  iconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    letterSpacing: 0.8,
    marginLeft: 6,
  },
  gridValue: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
    paddingLeft: 22,
  },
  gridValueHighlight: {
    fontSize: 15,
    color: '#0a7ea4',
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingLeft: 22,
  },
  colaboradorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerOperatorText: {
    fontSize: 12,
    color: '#475569',
    marginLeft: 6,
  },
  operatorName: {
    color: '#0f172a',
    fontWeight: '700',
  },
  secureBadge: {
    fontSize: 9,
    color: '#15803d',
    backgroundColor: '#e8f5e9',
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  emptyStateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15803d',
    padding: 28,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
    fontWeight: '500',
  },
  btnDevolver: {
    backgroundColor: '#0284c7',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    gap: 8
  },
  btnDevolverText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footerLogoContainer: {
    alignItems: 'center',
    marginTop: 48,
    opacity: 0.4,
  },
  footerLogoText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 8,
  }
});