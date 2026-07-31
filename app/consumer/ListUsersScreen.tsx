import { fetchUsuariosConsumer } from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeOutUp,
    Layout
} from 'react-native-reanimated';

export default function ListUsersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Estados de Filtro
  const [buscaNome, setBuscaNome] = useState('');
  const [buscaMatricula, setBuscaMatricula] = useState('');
  const [buscaSetor, setBuscaSetor] = useState('');

  // Configuração do TanStack Query
  const {
    data: usuarios = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['consumersx'],
    queryFn: fetchUsuariosConsumer,
  });

  const handleRefresh = async () => {
    await refetch();
  };

  // Função de Bloquear / Desbloquear Usuário
  async function handleToggleBloqueio(id: number, statusAtual: boolean) {
    const acao = statusAtual ? "bloquear" : "desbloquear";
    Alert.alert(
      "Confirmação",
      `Deseja realmente ${acao} este usuário?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: statusAtual ? "destructive" : "default",
          onPress: async () => {
            try {
              // await bloquearUsuario(id, !statusAtual);
              
              // Invalida a query para atualizar os dados do servidor automaticamente
              queryClient.invalidateQueries({ queryKey: ['consumersx'] });
              
              Alert.alert("Sucesso", `Usuário ${statusAtual ? "bloqueado" : "desbloqueado"} com sucesso!`);
            } catch (error) {
              Alert.alert("Erro", "Não foi possível alterar o status do usuário.");
            }
          }
        }
      ]
    );
  }

  // Função de Deletar Usuário
  async function handleDeletar(id: number) {
    Alert.alert(
      "Excluir Usuário",
      "Tem certeza que deseja apagar permanentemente este registro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              // await deletarUsuario(id);
              
              // Invalida a query para recarregar a lista atualizada
              queryClient.invalidateQueries({ queryKey: ['consumersx'] });
              
              Alert.alert("Sucesso", "Usuário excluído com sucesso!");
            } catch (error) {
              Alert.alert("Erro", "Falha ao excluir usuário.");
            }
          }
        }
      ]
    );
  }

  // Garantia de segurança caso a API retorne algo diferente de array
  const listaSegura = Array.isArray(usuarios) ? usuarios : [];

  // Filtragem local dos dados vindos da API
  const usuariosFiltrados = listaSegura.filter((user: any) => {
    const matchNome = (user?.nome || '').toLowerCase().includes(buscaNome.toLowerCase());
    const matchMatricula = (user?.matricula || '').toString().includes(buscaMatricula);
    const matchSetor = (user?.setor || '').toLowerCase().includes(buscaSetor.toLowerCase());
    return matchNome && matchMatricula && matchSetor;
  });

  return (
    <View style={styles.page}>
      {/* Cabeçalho */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={30} color="#0a7ea4" />
          </Pressable>
          <Text style={styles.title}>Gerenciar Usuários</Text>
        </View>

        {/* Botão de Criar Novo Usuário */}
        <Pressable
          style={styles.createButton}
          onPress={() => router.push('/consumer/create' as any)}
        >
          <MaterialCommunityIcons name="account-plus" size={20} color="#FFF" />
          <Text style={styles.createButtonText}>Novo Usuário</Text>
        </Pressable>

        {/* Área de Filtros */}
        <View style={styles.filterContainer}>
          <TextInput
            style={styles.filterInput}
            placeholder="Filtrar por nome..."
            placeholderTextColor="#94A3B8"
            value={buscaNome}
            onChangeText={setBuscaNome}
          />
          <View style={styles.filterRow}>
            <TextInput
              style={[styles.filterInput, { flex: 1 }]}
              placeholder="Matrícula"
              placeholderTextColor="#94A3B8"
              value={buscaMatricula}
              onChangeText={setBuscaMatricula}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.filterInput, { flex: 1 }]}
              placeholder="Setor"
              placeholderTextColor="#94A3B8"
              value={buscaSetor}
              onChangeText={setBuscaSetor}
            />
          </View>
        </View>
      </View>

      {/* Lista de Usuários */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : (
        <FlatList
          data={usuariosFiltrados}
          keyExtractor={(item: any) => (item?.id ? item.id.toString() : Math.random().toString())}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={handleRefresh} colors={['#0EA5E9']} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text>
          }
          renderItem={({ item, index }) => {
            const ativo =  true; // fallback caso a API não mande o campo explícito
            return (
              <Animated.View
                entering={FadeInDown.delay(index * 60).springify()}
                exiting={FadeOutUp}
                layout={Layout.springify()}
                style={[styles.card, !ativo && styles.cardBlocked]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.nome}</Text>
                    <Text style={styles.userSub}>Matrícula: {item.matricula} • Setor: {item.setor}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: ativo ? '#DCFCE7' : '#FEE2E2' }]}>
                    <Text style={[styles.badgeText, { color: ativo ? '#166534' : '#991B1B' }]}>
                      {ativo ? 'Ativo' : 'Bloqueado'}
                    </Text>
                  </View>
                </View>

                {/* Botões de Ação por Item */}
                <View style={styles.cardActions}>
                  {/* Editar */}
                  <Pressable
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => router.push({ pathname: '/consumer/create' as any, params: { id: item.id } })}
                  >
                    <MaterialCommunityIcons name="pencil" size={18} color="#0284C7" />
                    <Text style={styles.editBtnText}>Editar</Text>
                  </Pressable>

                  {/* Bloquear / Desbloquear */}
                  <Pressable
                    style={[styles.actionBtn, ativo ? styles.blockBtn : styles.unblockBtn]}
                    onPress={() => handleToggleBloqueio(item.id as any, ativo)}
                  >
                    <MaterialCommunityIcons
                      name={ativo ? "lock" : "lock-open"}
                      size={18}
                      color={ativo ? "#D97706" : "#16A34A"}
                    />
                    <Text style={[styles.actionText, { color: ativo ? "#D97706" : "#16A34A" }]}>
                      {ativo ? "Bloquear" : "Ativar"}
                    </Text>
                  </Pressable>

                  {/* Deletar */}
                  <Pressable
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDeletar(item.id as any)}
                  >
                    <MaterialCommunityIcons name="delete" size={18} color="#DC2626" />
                    <Text style={styles.deleteBtnText}>Excluir</Text>
                  </Pressable>
                </View>
              </Animated.View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F8FAFC" ,marginVertical:30},
  headerContainer: { padding: 10, backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: "#E2E8F0", gap: 14 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 24, fontWeight: "800", color: "#1E293B" },
  
  createButton: {
    backgroundColor: "#0EA5E9",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
  },
  createButtonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },

  filterContainer: { gap: 10 },
  filterInput: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#334155",
  },
  filterRow: { flexDirection: 'row', gap: 10 },

  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20, gap: 14 },
  emptyText: { textAlign: 'center', color: "#94A3B8", marginTop: 40, fontSize: 16 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    gap: 12,
  },
  cardBlocked: { opacity: 0.7, backgroundColor: "#F8FAFC" },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  userSub: { fontSize: 13, color: "#64748B" },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: "600" },

  cardActions: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 12, gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, gap: 4 },
  
  editBtn: { backgroundColor: "#E0F2FE" },
  editBtnText: { color: "#0284C7", fontWeight: "600", fontSize: 13 },

  blockBtn: { backgroundColor: "#FEF3C7" },
  unblockBtn: { backgroundColor: "#DCFCE7" },
  actionText: { fontWeight: "600", fontSize: 13 },

  deleteBtn: { backgroundColor: "#FEE2E2" },
  deleteBtnText: { color: "#DC2626", fontWeight: "600", fontSize: 13 },
});