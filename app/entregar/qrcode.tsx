import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

export default function EntregarQRCodeScreen() {
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  // Animação da linha de scanner (Laser)
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // Loop da animação da linha laser
  useEffect(() => {
    if (!scanned && permission?.granted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 210, // Altura máxima da caixa de scan
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
  }, [scanned, permission]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      // 🛡️ Tenta fazer o parse seguro do QR Code
      const json = JSON.parse(data);

      if (!json.chave || !json.arm) {
        throw new Error('QR Code inválido para este fluxo');
      }

      setTimeout(() => {
                router.push({
                  pathname: '/entregar/detalhesFacialItens',
                  params: { 
                    numeroDaChave: json.chave.toString(),
                    armarioId: json.arm.toString(), // Corrigido de 'arnarioId'
                  },
                });
              
      }, 300);

    } catch (error) {
      // Caso leiam um QR code genérico/comum por engano
      setTimeout(() => {
        onPress: () => setScanned(false) 
      }, 300);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.page, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Carregando câmera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.page, styles.centerContainer, { backgroundColor: '#f8fafc' }]}>
        <View style={styles.errorCard}>
          <MaterialCommunityIcons name="camera-off" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>Acesso Negado</Text>
          <Text style={styles.errorSubtitle}>
            Precisamos da permissão da câmera para realizar a leitura do QR Code do armário.
          </Text>
          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Permitir Câmera</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      {/* Botão flutuante de voltar com blur visual */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
      </Pressable>

      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* Máscara profissional de escurecimento periférico */}
        <View style={styles.maskContainer}>
          <View style={styles.maskTopBottom} />
          
          <View style={styles.maskMiddleRow}>
            <View style={styles.maskSide} />
            
            {/* Quadrante de Scan focado */}
            <View style={styles.scanTarget}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* Linha laser vermelha animada */}
              {!scanned && (
                <Animated.View 
                  style={[
                    styles.scanLaser, 
                    { transform: [{ translateY: scanLineAnim }] }
                  ]} 
                />
              )}
            </View>
            
            <View style={styles.maskSide} />
          </View>
          
          <View style={styles.maskTopBottom}>
            <Text style={styles.instruction}>
              {scanned ? 'Código processado!' : 'Posicione o QR Code dentro da área'}
            </Text>
          </View>
        </View>
      </CameraView>

      {/* Ação inferior flutuante */}
      {scanned && (
        <View style={styles.bottomSheet}>
          <Pressable style={styles.retakeButton} onPress={() => setScanned(false)}>
            <MaterialCommunityIcons name="refresh" size={20} color="#0a7ea4" />
            <Text style={styles.retakeText}>Escanear Novamente</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 20,
    zIndex: 50,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  // Estilização da Máscara do Scanner (Padrão Apps de Banco)
  maskContainer: {
    flex: 1,
  },
  maskTopBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  maskMiddleRow: {
    flexDirection: 'row',
    height: 240,
  },
  maskSide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  scanTarget: {
    width: 240,
    height: 240,
    backgroundColor: 'transparent',
    position: 'relative',
    justifyContent: 'flex-start',
  },
  
  // Cantoneiras da mira do QR Code
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#0a7ea4',
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  
  // Linha Laser Vermelha
  scanLaser: {
    height: 3,
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  
  instruction: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 32,
    letterSpacing: 0.3,
  },
  
  // Bottom Action Sheet quando está travado após leitura
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  retakeButton: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  retakeText: {
    color: '#0a7ea4',
    fontWeight: '700',
    fontSize: 16,
  },

  // Estado de Permissão Errada
  errorCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 32,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    textAlign: 'center',
    gap: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});