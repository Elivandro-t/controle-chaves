import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EntregarScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Text style={styles.title}>Como deseja identificar a chave?</Text>
        <Text style={styles.subtitle}>Escaneie o QR Code da chave ou selecione manualmente.</Text>

        <TouchableOpacity 
                  style={styles.qrCard} 
                  onPress={() => router.push('/entregar/qrcode')}
                  activeOpacity={0.9}
                >
                  
                    <View style={styles.qrInner}>
                      <MaterialCommunityIcons name="qrcode-scan" size={64} color="#3B82F6" />
                      <Text style={styles.subtitle}>Toque para iniciar leitura</Text>
                    </View>
                </TouchableOpacity>
            
        <Pressable
          style={[styles.optionCard, styles.secondaryCard]}
          onPress={() => router.push({
            pathname: '/entregar/selectArmario',
             params: {
               tipoDevolucao: "entrega" as any,
             }
          })}
        >
          <MaterialCommunityIcons name="magnify" size={48} color="#0a7ea4" />
          <Text style={[styles.optionTitle, styles.secondaryText]}>Selecionar Manualmente</Text>
          <Text style={[styles.optionSubtitle, styles.secondaryText]}>Filial → Armário → Chave</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#eef2ff',
    
  },
  container: {
    padding: 24,
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  // QR Card principal (Destacado)
  qrCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 6,
  },
  qrInner: {
    alignItems: 'center',
    gap: 12,
  },
  // Botão Manual (Pequeno e Elegante)
  optionCard: {
    flexDirection: 'row', // Alinha em linha para ficar compacto
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#bae6fd',
    shadowColor: '#0284c7',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  secondaryCard: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#bae6fd',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a7ea4',
  },
  secondaryText: {
    color: '#0a7ea4',
  },
  optionSubtitle: {
    display: 'none', // Ocultado para manter o botão pequeno como solicitado
  },
});