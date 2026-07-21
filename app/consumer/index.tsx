import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { fetchUsuariosConsumer } from '../../services/api';

type UsuarioConsumer = {
  matricula: string;
  GmcoreId: number;
  nome: string;
  setor: string;
  filial: number;
  usuarioInsert: string;
};

export default function ConsumersScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const consumersQuery = useQuery({
    queryKey: ['consumers'],
    queryFn: fetchUsuariosConsumer,
  });

  const handleRefresh = () => {
    setRefreshing(true);
    consumersQuery.refetch().finally(() => setRefreshing(false));
  };

  const handleDelete = (matricula: string) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja excluir o usuário com matrícula ${matricula}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete API call
            Alert.alert('Sucesso', 'Usuário excluído');
          },
        },
      ]
    );
  };

  const renderConsumer = ({ item }: { item: UsuarioConsumer }) => (
    <View style={styles.consumerCard}>
      <View style={styles.consumerContent}>
        <Text style={styles.consumerName}>{item.nome}</Text>
        <Text style={styles.consumerDetail}>Matrícula: {item.matricula}</Text>
        <Text style={styles.consumerDetail}>GmcoreId: {item.GmcoreId}</Text>
        <Text style={styles.consumerDetail}>Setor: {item.setor}</Text>
        <Text style={styles.consumerDetail}>Filial: {item.filial}</Text>
        <Text style={styles.consumerDetail}>Inserido por: {item.usuarioInsert}</Text>
      </View>
      <Pressable
        style={styles.deleteButton}
        onPress={() => handleDelete(item.matricula)}
      >
        <MaterialCommunityIcons name="delete" size={20} color="#b91c1c" />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.page}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <MaterialCommunityIcons name="chevron-left" size={28} color="#0a7ea4" />
      </Pressable>

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Usuários Consumidores</Text>
          <Text style={styles.subtitle}>Total: {consumersQuery.data?.length ?? 0}</Text>
        </View>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push('/consumer/create')}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#ffffff" />
        </Pressable>
      </View>

      {consumersQuery.isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : consumersQuery.isError ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#b91c1c" />
          <Text style={styles.errorText}>Erro ao carregar usuários</Text>
          <Pressable style={styles.retryButton} onPress={() => consumersQuery.refetch()}>
            <Text style={styles.retryText}>Tentar Novamente</Text>
          </Pressable>
        </View>
      ) : (consumersQuery.data?.length ?? 0) === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="inbox-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>Nenhum usuário cadastrado</Text>
          <Pressable
            style={styles.createFirstButton}
            onPress={() => router.push('/consumer/create')}
          >
            <Text style={styles.createFirstText}>Cadastrar Primeiro Usuário</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={consumersQuery?.data as any}
          renderItem={renderConsumer}
          keyExtractor={(item) => item.matricula}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#0a7ea4']}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  backButton: {
    marginLeft: 16,
    marginTop: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  consumerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  consumerContent: {
    flex: 1,
    gap: 6,
  },
  consumerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  consumerDetail: {
    fontSize: 13,
    color: '#64748b',
  },
  deleteButton: {
    marginLeft: 12,
    padding: 8,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
  createFirstButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  createFirstText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
