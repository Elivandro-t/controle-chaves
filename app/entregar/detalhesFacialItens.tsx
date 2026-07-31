import { getUserId } from '@/services/storage';
import { showError } from '@/services/toast';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { detlhesFacial, submitEntregaChave, submitEntregaChaveTotem } from '../../services/api';

const { width } = Dimensions.get('window');

export default function DetalhesFacialItens() {
  const params = useLocalSearchParams<{ armarioId: string; numeroDaChave: string; tipoSelecionado?: string }>();
  const queryClient = useQueryClient();
  const router = useRouter();

  // --- HOOKS ---
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagemFacial, setImagemFacial] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | any>(null);

  const createMutation = useMutation({
    mutationFn: params.tipoSelecionado === "totem"?submitEntregaChaveTotem: submitEntregaChave,
    onSuccess: (data:any) => {
      setFeedbackMessage({
        type: 'success',
        text: data.msg,
      });
      queryClient.invalidateQueries({ queryKey: ['armariosgg'] });
      queryClient.invalidateQueries({ queryKey: ['ArmarioUnicoggg'] });
      
      setTimeout(() => {
        router.dismissAll();
        if (params.tipoSelecionado === "totem") {
          router.replace('/entregar/entregarToten');
        } else {
          router.replace('/entregar');
        }
      }, 5000);
    },
    onError: (error: any) => {
      const errorMsg = error?.message || 'Falha na comunicação com o servidor.';
      setFeedbackMessage({
        type: 'error',
        text: errorMsg,
      });
      showError('Erro ao entregar chave', errorMsg);
    }
  });

  // --- FUNÇÕES ---
  async function abrirCamera() {
    setFeedbackMessage(null);
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("Permissão necessária", "Libere a câmera");
        return;
      }
    }

    setCameraOpen(true);
    setImagemFacial('');

    timerRef.current = setTimeout(() => {
      capturarFoto();
    }, 2000);
  }

  async function capturarFoto() {
    try {
      if (!cameraRef.current) return;

      const foto = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
        shutterSound: false,
      });

      if (!foto?.base64) {
        Alert.alert("Erro", "Imagem inválida");
        setCameraOpen(false);
        return;
      }

      const imagem = `data:image/jpeg;base64,${foto.base64}`;
      setImagemFacial(imagem);
      setCameraOpen(false);
      await reconhecerFace(imagem);
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Erro ao capturar rosto");
      setCameraOpen(false);
    }
  }

  async function reconhecerFace(imagem: string) {
    try {
      setLoading(true);
      setFeedbackMessage(null);
      const data = await detlhesFacial(imagem as any);
      if(data){
        handleConfirm(data)
      }
    } catch (error: any) {
      console.log(error);
      setFeedbackMessage({
        type: 'error',
        text: "Usuário não reconhecido. Tente novamente.",
      });
      Alert.alert("Erro", "Usuário não reconhecido");
    } finally {
      setLoading(false);
    }
  }

  const handleConfirm = async (data:any) => {
    try {
      const usuarioID = await getUserId();
      const payload = {
        usuarioId: usuarioID,
        gmIDMatricula: data?.matricula,
        armarioId: Number(params?.armarioId),
        numeroDaChave: params?.numeroDaChave,
      };
      createMutation.mutate(payload as any);
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: 'Não foi possível recuperar o ID do usuário logado.',
      });
      showError('Erro', 'Não foi possível recuperar o ID do usuário logado.');
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // --- RENDERIZAÇÃO CONDICIONAL ---
  if (cameraOpen) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" />
        <View style={styles.cameraOverlay}>
          <View style={styles.faceTargetRing} />
        </View>
        <View style={styles.captureStatus}>
          <ActivityIndicator size="small" color="#fff" style={{ marginBottom: 8 }} />
          <Text style={styles.captureStatusText}>Aguarde, capturando em 1s...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={26} color="#0284c7" />
        </Pressable>
        <Text style={styles.headerTitle}>Entrega de Chave</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="lock-outline" size={20} color="#0284c7" />
          <Text style={styles.infoLabel}>Armário:</Text>
          <Text style={styles.infoValue}>{params?.armarioId || 'N/A'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="key-variant" size={20} color="#0284c7" />
          <Text style={styles.infoLabel}>Chave:</Text>
          <Text style={styles.infoValue}>{params?.numeroDaChave || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons 
            name={imagemFacial ? "face-recognition" : "camera-face" as any} 
            size={64} 
            color="#0284c7" 
          />
        </View>

        <Text style={styles.title}>Reconhecimento Facial</Text>
        <Text style={styles.subtitle}>
          Posicione o rosto em frente à câmera para validar a identidade e concluir a entrega com segurança.
        </Text>

        <Pressable 
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} 
          onPress={abrirCamera}
          disabled={loading || createMutation.isPending}
        >
          <MaterialCommunityIcons name="camera" size={20} color="#fff" />
          <Text style={styles.buttonText}>
            {imagemFacial ? "Reconhecer Novamente" : "Capturar Face"}
          </Text>
        </Pressable>
      </View>

      {(loading || createMutation.isPending) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={styles.loadingText}>Processando validação...</Text>
        </View>
      )}

      {feedbackMessage && (
        <View style={[
          styles.feedbackBox, 
          feedbackMessage.type === 'success' ? styles.feedbackSuccess : styles.feedbackError
        ]}>
          <MaterialCommunityIcons 
            name={feedbackMessage.type === 'success' ? "check-circle" : "alert-circle"} 
            size={24} 
            color={feedbackMessage.type === 'success' ? "#166534" : "#991b1b"} 
          />
          <Text style={[
            styles.feedbackText,
            feedbackMessage.type === 'success' ? styles.feedbackTextSuccess : styles.feedbackTextError
          ]}>
            {feedbackMessage.text}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  content: { 
    padding: 20, 
    paddingBottom: 40,
    gap: 20 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardInfo: { 
    backgroundColor: '#ffffff', 
    padding: 16, 
    borderRadius: 16, 
    gap: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoLabel: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '700',
    marginLeft: 'auto',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  actionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#0f172a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  button: { 
    backgroundColor: '#0284c7', 
    width: '100%',
    paddingVertical: 16, 
    borderRadius: 14, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 16,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceTargetRing: {
    width: width * 0.7,
    height: width * 0.9,
    borderRadius: width * 0.35,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderStyle: 'dashed',
  },
  captureStatus: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
  },
  captureStatusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  feedbackError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  feedbackText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  feedbackTextSuccess: {
    color: '#166534',
  },
  feedbackTextError: {
    color: '#991b1b',
  },
});