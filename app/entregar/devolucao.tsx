import { devolverChave } from '@/services/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getUserId } from '../../services/storage';

export default function DevolucaoChaveScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  // Estado que mantém a câmera embutida no card da rota atual
  const [cameraInlineActive, setCameraInlineActive] = useState(false);

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

  async function handleIniciarLeitura() {
    if (!permission) return;
    if (!permission.granted) {
      const resposta = await requestPermission();
      if (!resposta.granted) {
        Alert.alert('Permissão Negada', 'Precisamos de acesso à câmera para ler o QR Code.');
        return;
      }
    }
    setScanned(false);
    setCameraInlineActive(true);
  }

  async function handleBarCodeScanned({ data }: { data: string }) {
    setScanned(true);
    setCameraInlineActive(false); // Retorna o card ao estado original de escaneamento
    setLoading(true);

    try {
      let objetoQrCode;
      try {
        objetoQrCode = JSON.parse(data);
      } catch {
        Alert.alert('Erro', 'QR Code lido, mas o formato não é um JSON válido.');
        return;
      }

      if (!objetoQrCode?.chave || !objetoQrCode?.arm) {
        Alert.alert('Erro', 'QR Code inválido. Campos chave e arm são obrigatórios.');
        return;
      }

      const payload = {
        usuarioId: Number(userId),
        item: objetoQrCode,
      };

      const response = await devolverChave(payload);

      if (response) {
        Alert.alert('Sucesso', `Chave ${objetoQrCode.chave} devolvida com sucesso!`);
        router.back();
      }
    } catch (error: any) {
       console.log(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#0f172a',
          headerTitleAlign: 'left',
          headerTitle: 'Receber Chave',
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 8 }}>
              <Ionicons name="arrow-back" size={22} color="#0f172a" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Banner Informativo Integrado */}
        <View style={styles.alertBanner}>
          <Text style={styles.alertTitle}>Retorno de Ativos</Text>
          <Text style={styles.alertSubtitle}>
            Aponte a câmera para o QR Code fixado na chave devolvida pelo colaborador para processar a baixa automática.
          </Text>
        </View>

        {/* Card de Scan Integrado com Camera Nativa Inline */}
        <View style={cameraInlineActive ? styles.qrCardActiveCamera : styles.qrCard}>
          {cameraInlineActive ? (
            <View style={styles.inlineCameraWrapper}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              />
              
              {/* Moldura / Mira embutida dentro dos limites do card */}
              <View style={styles.scannerTargetBox}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>

              {/* Botão de Fechar/Cancelar câmera embutido no rodapé do card */}
              <TouchableOpacity 
                style={styles.closeInlineCameraButton} 
                onPress={() => setCameraInlineActive(false)}
              >
                <Text style={styles.closeInlineCameraText}>CANCELAR LEITURA</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.qrTouchArea} 
              onPress={handleIniciarLeitura}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#0284c7" />
              ) : (
                <View style={styles.qrInner}>
                  <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="qrcode-scan" size={32} color="#0284c7" />
                  </View>
                  <Text style={styles.qrTitle}>Escanear Código QR</Text>
                  <Text style={styles.qrSubtitle}>Toque aqui para embutir o leitor</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Botão de Seleção Manual Minimalista */}
        <Pressable
          style={({ pressed }) => [
            styles.secondaryCard,
            { transform: [{ scale: pressed ? 0.98 : 1 }] }
          ]}
          onPress={() => router.push({
            pathname: '/entregar/selectArmario',
            params: { tipoDevolucao: "devolucao" },
          })}
        >
          <View style={styles.secondaryLeftRow}>
            <View style={styles.manualIconWrapper}>
              <MaterialCommunityIcons name="text-box-search-outline" size={18} color="#475569" />
            </View>
            <View>
              <Text style={styles.optionTitle}>Busca Manual de Ativos</Text>
              <Text style={styles.optionSubtitle}>Filial → Módulo → Chave individual</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 16,
  },
  alertBanner: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#e0f2fe',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369a1',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 12,
    color: '#0284c7',
    lineHeight: 16,
    fontWeight: '500',
  },
  
  // Card de Scan Estilo Tracejado Premium (Modo Ocioso / Botão)
  qrCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    marginBottom: 12,
    overflow: 'hidden',
  },
  qrTouchArea: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrInner: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qrTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 12,
  },
  qrSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },

  // Estado Ativo: O card se expande na rota para alocar a Câmera nativamente
  qrCardActiveCamera: {
    height: 260, // Altura dimensionada estritamente ao espaço do card
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#0284c7',
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineCameraWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerTargetBox: {
    width: 160,
    height: 160,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  
  // Cantoneiras de Foco embutidas na miniatura da câmera
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: '#0284c7',
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  
  closeInlineCameraButton: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  closeInlineCameraText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Seleção manual alinhada na mesma rota
  secondaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
  },
  secondaryLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  manualIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  optionSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
    fontWeight: '500',
  },
});