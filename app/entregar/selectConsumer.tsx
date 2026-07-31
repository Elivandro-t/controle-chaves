import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
// 👉 Importado para resolver o problema dos botões colados no bottom
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getUserId } from '@/services/storage';
import { fetchUsuariosConsumer, submitEntregaChave } from '../../services/api';
import { showError } from '../../services/toast';

type UsuarioConsumer = {
  id?: number;
  matricula: string;
  GmcoreId: string;
  nome: string;
  setor: string;
  filial: number;
  usuarioInsert: number;
  armarioId?: string; 
};

export default function SelectConsumerScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets(); // 👉 Captura a área segura inferior do aparelho
  
  const params = useLocalSearchParams<{ armarioId: string; numeroDaChave: string; tipoSelecionado?: string }>();
  
  const [search, setSearch] = useState('');
  const [selectedConsumer, setSelectedConsumer] = useState<UsuarioConsumer | null>(null);

  const consumersQuery = useQuery({
    queryKey: ['consumers'],
    queryFn: fetchUsuariosConsumer,
  });

  const createMutation = useMutation({
    mutationFn: submitEntregaChave,
    onSuccess: () => {
      Alert.alert('Sucesso', `Chave número ${params.numeroDaChave} entregue com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['armarios'] });
      queryClient.invalidateQueries({ queryKey: ['ArmarioUnico'] });
      router.dismissAll();
      if(params.tipoSelecionado==="entregaManual"){
        router.replace('/armarios');
        return;
      }
      if(params.tipoSelecionado==="totem"){
        router.replace('/entregar/entregarToten');
      }else{
        router.replace('/armarios/ArmariosScreen');
      }
    },
    onError: (error: any) => {
      showError('Erro ao entregar chave', error?.message || 'Falha na comunicação com o servidor.');
    }
  });

  const consumers = consumersQuery.data ?? [];
  
  const filtered = useMemo(() => {
    if (!search.trim()) return consumers;
    const termo = search.toLowerCase().trim();
    return consumers.filter((c) =>
      c.nome.toLowerCase().includes(termo) ||
      c.matricula.toLowerCase().includes(termo)
    );
  }, [consumers, search]);

  const handleSelect = (consumer: UsuarioConsumer) => {
    if(consumer === selectedConsumer){
      setSelectedConsumer(null);
    }else{
      setSelectedConsumer(consumer);
    }
  };

  const handleConfirm = async () => {
    if (!selectedConsumer) {
      Alert.alert('Atenção', 'Selecione um colaborador antes de confirmar.');
      return;
    }
    
    try {
      // Busca o ID de forma assíncrona logo antes de disparar, sem travar a renderização
      const usuarioID = await getUserId();
      
      const payload = {
        usuarioId: usuarioID, 
        gmIDMatricula: selectedConsumer.GmcoreId || `GM${selectedConsumer.matricula}`,
        armarioId: Number(params?.armarioId),
        numeroDaChave: params?.numeroDaChave,
      };

      createMutation.mutate(payload as any);
    } catch (err) {
      showError('Erro', 'Não foi possível recuperar o ID do usuário logado.');
    }
  };

  const renderConsumer = ({ item }: { item: UsuarioConsumer }) => (
    <Pressable
      style={[
        styles.consumerCard,
        selectedConsumer?.matricula === item.matricula && styles.selectedCard,
      ]}
      onPress={() => handleSelect(item)}
    >
      <View style={styles.consumerContent}>
        <Text style={styles.consumerName}>{item.nome}</Text>
        <Text style={styles.consumerDetail}>Matrícula: {item.matricula}</Text>
        <Text style={styles.consumerDetail}>Setor: {item.setor}</Text>
      </View>
      {selectedConsumer?.matricula === item.matricula && (
        <MaterialCommunityIcons name="check-circle" size={24} color="#0a7ea4" />
      )}
    </Pressable>
  );

  return (
   <SafeAreaView style={[styles.page, { paddingBottom: insets.bottom }]}>
         <View style={styles.page}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <MaterialCommunityIcons name="chevron-left" size={28} color="#0a7ea4" />
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>Selecione o Colaborador</Text>
        <Text style={styles.subtitle}>Quem vai receber a chave?</Text>
        
        {params.numeroDaChave && (
          <View style={styles.badgeChave}>
            <Text style={styles.badgeText}>🔑 Vinculando ao Armário: {params.numeroDaChave}</Text>
          </View>
        )}
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou matrícula"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#cbd5e1"
        />
      </View>

      {consumersQuery.isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="inbox-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>Nenhum colaborador encontrado</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderConsumer}
          keyExtractor={(item) => item.matricula}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* 👉 Rodapé ajustado dinamicamente para desgrudar da parte de baixo física do celular */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={[styles.button, styles.cancelButton]}
          onPress={() => router.back()}
          disabled={createMutation.isPending}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
        <Pressable
          style={[
            styles.button, 
            (!selectedConsumer || createMutation.isPending) && styles.disabledButton
          ]}
          onPress={handleConfirm}
          disabled={!selectedConsumer || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Confirmar Entrega</Text>
          )}
        </Pressable>
      </View>
    </View>
   </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f0f9ff' },
  backButton: { marginLeft: 16, marginTop: 16, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  subtitle: { marginTop: 4, color: '#64748b', fontSize: 14 },
  badgeChave: { backgroundColor: '#e0f2fe', padding: 8, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#bae6fd' },
  badgeText: { color: '#0369a1', fontWeight: '700', fontSize: 13 },
  searchContainer: { marginHorizontal: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#cbd5e1' },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 15, color: '#0f172a' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  
  // Aumentado o paddingBottom para o conteúdo da lista não sumir atrás do rodapé branco
  listContent: { paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 32, gap: 8 },
  
  consumerCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0' },
  selectedCard: { borderColor: '#0a7ea4', backgroundColor: '#f0f9ff' },
  consumerContent: { flex: 1, gap: 4 },
  consumerName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  consumerDetail: { fontSize: 13, color: '#64748b' },
  emptyText: { color: '#64748b', fontSize: 15 },
  
  // Rodapé corrigido
  footer: { 
    flexDirection: 'row', 
    gap: 12, 
    paddingHorizontal: 16, 
    paddingTop: 16, 
    backgroundColor: '#ffffff', 
    borderTopWidth: 1, 
    borderTopColor: '#e2e8f0' 
  },
  button: { flex: 1, backgroundColor: '#0a7ea4', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  cancelButton: { backgroundColor: '#e2e8f0' },
  disabledButton: { opacity: 0.4 },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  cancelText: { color: '#0f172a', fontWeight: '700', fontSize: 15 },
});