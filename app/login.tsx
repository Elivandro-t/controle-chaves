import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { loginUser } from '../services/api';
import { setAuthToken, setUserId } from '../services/storage';

export default function LoginScreen() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleLogin() {
    setError('');

    if (!login.trim() || !password.trim()) {
      setError('Informe usuário e senha para continuar.');
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser({ email: login.trim(), password });
      await setAuthToken(response.acessToken);
      await setUserId(String(response.usuario?.id ?? ''));
      router.replace('/filial');
    } catch {
      setError('Falha no login. Verifique suas credenciais e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.mainContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.scrollPage}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header da Marca do Sistema */}
          <View style={styles.brandHeader}>
            <View style={styles.logoIconBg}>
              <MaterialIcons name="security" size={40} color="#0284c7" />
            </View>
            <Text style={styles.title}>Controle de Chaves</Text>
            <Text style={styles.subtitle}>Terminal de Monitoramento e Acesso</Text>
          </View>

          {/* Card de Login */}
          <View style={styles.card}>
            {/**<Text style={styles.cardTitle}>Autenticação</Text> */}

            {/* Campo Usuário */}
            <View style={styles.field}>
              <Text style={styles.label}>Usuário / E-mail</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  value={login}
                  onChangeText={setLogin}
                  style={styles.input}
                  placeholder="Ex: portaria.filial116"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="default"
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Campo Senha */}
            <View style={styles.field}>
              <Text style={styles.label}>Senha de Segurança</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  style={[styles.input, styles.inputPasswordPadding]}
                  placeholder="••••••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                />
                <Pressable
                  onPress={() => setShowPassword((s) => !s)}
                  style={styles.eyeAbsolute}
                  accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color="#64748B"
                  />
                </Pressable>
              </View>
            </View>

            {/* Alerta de Erro Customizado */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Botão de Entrar */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText}>Acessar Painel</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFF" style={styles.btnArrow} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Rodapé de Versão */}
          <Text style={styles.footerVersion}>v2.4.0 • Gestão de Projetos</Text>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#ffffff', // Fundo Light Limpo
  },
  scrollPage: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  /* Marca do Sistema */
  brandHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIconBg: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  /* Card de Login */
  card: {
    backgroundColor: '#ffffff', // Fundo do Card Branco
   
    padding: 24,
    borderColor: '#e2e8f0',
    shadowOpacity: 0.05,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  /* Customização de Inputs com Ícone */
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    height: 52,
    position: 'relative',
  },
  inputIcon: {
    paddingLeft: 14,
    position: 'absolute',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingLeft: 46,
    paddingRight: 16,
    color: '#0f172a',
    fontSize: 15,
  },
  inputPasswordPadding: {
    paddingRight: 48,
  },
  eyeAbsolute: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  /* Bloco de Erro */
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  /* Botão de Ação */
  button: {
    backgroundColor: '#0284c7', // Azul Padrão Clean
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#0284c7',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  btnArrow: {
    marginLeft: 8,
    marginTop: 1,
  },
  footerVersion: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 24,
    letterSpacing: 0.5,
  },
});

