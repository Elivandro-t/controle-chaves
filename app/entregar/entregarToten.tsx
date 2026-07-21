import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function EntregarScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const isFocused = useIsFocused(); // >>> Monitora se a tela está ativa na stack <<<

  const [scanned, setScanned] = useState(false);
  const [isTabsHidden, setIsTabsHidden] = useState(true);
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // Efeito principal: Esconde a barra de abas de baixo ao entrar nesta tela
  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: isTabsHidden ? { display: 'none' } : undefined
    });
  }, [navigation, isTabsHidden]);

  // Animação do laser vermelho do QR Code (reinicia com a tela focada)
  useEffect(() => {
    if (isFocused && !scanned && permission?.granted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 210,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanLineAnim.setValue(0);
    }
  }, [isFocused, scanned, permission]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const json = JSON.parse(data);

      if (!json.chave || !json.arm) {
        throw new Error('Invalido');
      }

      router.push({
        pathname: '/entregar/detalhesFacialItens',
        params: { 
          numeroDaChave: json.chave.toString(),
          armarioId: json.arm.toString(),
          tipoSelecionado: "totem"
        },
      });
      
      setTimeout(() => setScanned(false), 1000);

    } catch (error) {
      Alert.alert(
        'QR Code Inválido',
        'Este código não pertence a um armário homologado do sistema.',
        [{ text: 'Tentar Novamente', onPress: () => setScanned(false) }]
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        
        {/* FILTRO DE INTERFACE: BOTÃO DE TELA CHEIA (ESCONDER/MOSTRAR TABS) */}
        <View style={styles.headerRow}>
          <View style={styles.titleWrapper}>
            <Text style={styles.title}>Identificação de Chave</Text>
            <Text style={styles.subtitle}>Escaneie o QR Code fixado no armário.</Text>
          </View>
          
          <Pressable 
            style={[styles.toggleTabsButton, isTabsHidden && styles.toggleTabsButtonActive]} 
            onPress={() => setIsTabsHidden(!isTabsHidden)}
          >
            <MaterialCommunityIcons 
              name={isTabsHidden ? "fullscreen-exit" : "fullscreen"} 
              size={24} 
              color={isTabsHidden ? "#ffffff" : "#0a7ea4"} 
            />
          </Pressable>
        </View>

        {/* 📸 CARD 1: CÂMERA EM ÁREA TOTAL (só monta se estiver focado) */}
        <View style={styles.cameraCard}>
          {isFocused ? (
            !permission ? (
              <View style={styles.centerFeedback}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.feedbackText}>Carregando câmera...</Text>
              </View>
            ) : !permission.granted ? (
              <View style={styles.centerFeedback}>
                <MaterialCommunityIcons name="camera-off" size={44} color="#e2e8f0" />
                <Text style={styles.feedbackText}>Acesso à câmera necessário</Text>
                <Pressable style={styles.permissionButton} onPress={requestPermission}>
                  <Text style={styles.permissionButtonText}>Permitir</Text>
                </Pressable>
              </View>
            ) : (
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                facing="front"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              >
                <View style={styles.maskContainer}>
                  <View style={styles.maskTopBottom}>
                    <Text style={styles.scanInstruction}>Aponte para o QR Code</Text>
                  </View>
                  
                  <View style={styles.maskMiddleRow}>
                    <View style={styles.maskSide} />
                    
                    <View style={styles.scanTarget}>
                      <View style={[styles.corner, styles.topLeft]} />
                      <View style={[styles.corner, styles.topRight]} />
                      <View style={[styles.corner, styles.bottomLeft]} />
                      <View style={[styles.corner, styles.bottomRight]} />
                      
                      {!scanned && (
                        <Animated.View 
                          style={[styles.scanLaser, { transform: [{ translateY: scanLineAnim }] }]} 
                        />
                      )}
                    </View>
                    
                    <View style={styles.maskSide} />
                  </View>
                  
                  <View style={styles.maskTopBottom} />
                </View>
              </CameraView>
            )
          ) : (
            // Feedback leve enquanto a tela não está em foco para evitar flicker ou tela preta
            <View style={styles.centerFeedback}>
              <ActivityIndicator size="small" color="#ffffff" />
            </View>
          )}
        </View>

        {/* 🖐️ CARD 2: SELEÇÃO MANUAL */}
        <Pressable
          style={styles.secondaryCard}
          onPress={() => router.push('/entregar/manual')}
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
    backgroundColor: '#eef2ff',
  },
  container: {
    padding: 24,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  toggleTabsButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleTabsButtonActive: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  cameraCard: {
    width: '100%',
    height: 340, 
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0a7ea4',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  centerFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  feedbackText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  permissionButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 4,
  },
  permissionButtonText: {
    color: '#0a7ea4',
    fontWeight: '700',
    fontSize: 15,
  },
  maskContainer: {
    flex: 1,
  },
  maskTopBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  maskMiddleRow: {
    flexDirection: 'row',
    height: 220,
  },
  maskSide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  scanTarget: {
    width: 220,
    height: 220,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  scanInstruction: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: 'rgba(10, 126, 164, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#ffffff',
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  scanLaser: {
    height: 3,
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#ef4444',
  },
  secondaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#bae6fd',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryText: {
    color: '#0a7ea4',
  },
  optionSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
});