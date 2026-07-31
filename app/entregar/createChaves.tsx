import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import SelecaoModal from '@/components/SelecaoModal';
import { createArmarioChaves, fetchArmarios } from '../../services/api';
import { getSelectedFilial } from '../../services/storage';

type ArmarioItem = {
  id: number;
  numero: number;
  ativo: boolean;
  armario: {
    filial: number;
    tipo: string;
  };
  disponivel: boolean;
  status: string;
};

export default function CreateArmarioChavesScreen() {
  const router = useRouter();
  const [filial, setFilial] = useState<number | null>(null);
  const [selectedArmario, setSelectedArmario] = useState<any | null>(null);
  const [quantidade, setQuantidade] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSelectedFilial().then((f) => setFilial(f));
  }, []);

  const armariosQuery = useQuery({
    queryKey: ['armarios', filial],
    queryFn: async () => {
      const data = await fetchArmarios();
      const filtered = data.filter((item) => item.filial === filial);
      const allBlocos: any[] = [];
      filtered.forEach((group) => {
        allBlocos.push(group);
      });
    
      return allBlocos;
    },
    enabled: filial !== null,
  });
  const armarios = armariosQuery.data ?? [];

  const handleSubmit = async () => {
    if (!selectedArmario || !quantidade.trim()) {
      Alert.alert('Erro', 'Selecione um armário e informe a quantidade');
      return;
    }

    setLoading(true);
    try {
      await createArmarioChaves({
        amarioId: selectedArmario?.id,
        quantidade: Number(quantidade),
      });

      Alert.alert('Sucesso', `${quantidade} chave(s) adicionada(s) ao armário ${selectedArmario.numero}!`, [
        {
          text: 'OK',
          onPress: () => {
            setSelectedArmario(null);
            setQuantidade('');
            armariosQuery.refetch();
          },
        },
      ]);
    } catch (error) {

      console.error('Create chaves error:', error);
    } finally {
      setLoading(false);
    }
  };
  const [open,setOpen]=useState(false)
  const handleCreateArm = ()=>{
     setOpen(true)
  }
const handleOnClose = ()=>{
       setOpen(false)

}
  const renderArmario = ({ item }: { item: any }) => (
    <Pressable
      style={[
        styles.armarioCard,
        selectedArmario?.armarioId === item.id && styles.selectedCard,
      ]}
      onPress={() => setSelectedArmario(item)}
    >
      <View style={styles.armarioContent}>
        <Text style={styles.armarioType}>
          {item?.tipo.replace('_', ' ').toUpperCase()}
        </Text>
        <Text style={styles.armarioNumber}>{item?.tipo.replace('_', ' ').toUpperCase()}</Text>
        <Text style={styles.armarioStatus}>
          {item.disponivel ? '✓ LIVRE' : '✗ ' + item.status}
        </Text>
      </View>
      {selectedArmario?.armarioId === item.armarioId && (
        <MaterialCommunityIcons name="check-circle" size={24} color="#0a7ea4" />
      )}
    </Pressable>
  );

  return (
    <View style={styles.page}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <MaterialCommunityIcons name="chevron-left" size={28} color="#0a7ea4" />
      </Pressable>

      <View style={styles.headerSideBar}>
        <View style={styles.header}>
          <Text style={styles.title}>Cadastrar Chaves ao Armário</Text>
          <Text style={styles.subtitle}>
            Adicione chaves (blocos) aos armários
          </Text>
        </View>
        <TouchableOpacity
         
          onPress={() => handleCreateArm()}
          disabled={open}
        >
          {open ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text  style={styles.buttonSideBar
          }>Novo</Text>
          )}
        </TouchableOpacity>
      </View>

      {armariosQuery.isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : armarios.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="inbox-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>Nenhum armário encontrado</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Selecione o Armário</Text>
          <FlatList
            data={armarios}
            renderItem={renderArmario}
            keyExtractor={(item) => item?.amarioId?.toString()}
            contentContainerStyle={styles.listContent}
            scrollEnabled={false}
          />

          {selectedArmario && (
            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>Quantidade de Chaves</Text>
              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={styles.label}>
                    Quantas chaves adicionar ao Armário {selectedArmario.armarioId}?
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 5"
                    value={quantidade}
                    onChangeText={setQuantidade}
                    keyboardType="number-pad"
                    editable={!loading}
                  />
                </View>

                <View style={styles.buttonRow}>
                  <Pressable
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => {
                      setSelectedArmario(null);
                      setQuantidade('');
                    }}
                    disabled={loading}
                  >
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={styles.button}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.buttonText}>Adicionar</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </>
      )}
      {open && <SelecaoModal visible={open} onClose={handleOnClose} onSubmit={handleCreateArm}/>}
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
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  sectionTitle: {
    paddingHorizontal: 20,
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  armarioCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginHorizontal: 4,
  },
  selectedCard: {
    borderColor: '#0a7ea4',
    backgroundColor: '#f0f9ff',
  },
  armarioContent: {
    flex: 1,
    gap: 4,
  },
  armarioType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  armarioNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  armarioStatus: {
    fontSize: 13,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingVertical: 50,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  button: {
    flex: 1,
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e2e8f0',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  cancelText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 15,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 15,
  },
  headerSideBar: {
    display: 'flex',
    flexDirection: 'row',
  },
  buttonSideBar: {
    color: '#0a7ea4',
    justifyContent:'center'
  }
});
