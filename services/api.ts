import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';
import { AUTH_TOKEN_KEY } from './storage';
// eslint-disable-next-line import/no-named-as-default-member
const api = axios.create({
  baseURL: 'http://10.70.71.131:8080',
  timeout: 12000,
});
// Callback executed when session expires (401/403)
let onSessionExpired: (() => void) | null = null;
export function setOnSessionExpired(callback: () => void) {
  onSessionExpired = callback;
}

api.interceptors.request.use(async (config) => {
  const url = config.url ?? '';
  // Do not attach auth token when calling the login endpoint
  if (url.includes('/portaria/v1/usuario/login')) {
    return config;
  }

  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  if (!config.headers) {
    config.headers = {} as any;
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    if (status === 403 && 500) {
      if (onSessionExpired) {
      }
      const err = new Error('Sessão expirada. Faça login novamente.');
      (err as any).code = 'SESSION_EXPIRED';
      throw err;
    }
    if (status === 401) {
      if (onSessionExpired) {
      }
      Alert.alert(error.response?.data?.message || 'Não autorizado. Faça login novamente.');
    }
    throw error;
  }
);

export type LoginResponse = {
  acessToken: string;
  usuario: {
    id: number;
  };
};

export async function loginUser(credentials: { email: string; password: string }): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/portaria/v1/usuario/login', {
    email: credentials.email,
    password: credentials.password,
  });
  return response.data;
}
export type ArmarioGroup = {
  filial: number;
  tipo: string;
  bloco: {
    id: number;
    numero: number;
    ativo: boolean;
    armario: {
      filial: number;
      tipo: string;
    };
    disponivel: boolean;
    status: string;
  }[];
};
export async function fetchArmarios() {
  try {
    const response = await api.get<ArmarioGroup[]>('/armario');
    return response.data;
  } catch (error) {
    throw error;
  }
}
export type EntregaChavePayload = {
  gmIDMatricula: string;
  numeroDaChave: number;
  armarioId: number;
  usuarioId: number;
};

export async function submitEntregaChave(payload: EntregaChavePayload) {
  console.log('Enviando dados para entrega de chave:', payload);
  const response = await api.post('/entregaChaves', payload);
  return response.data;
}

export type UsuarioConsumer = {
  id?: number;
  matricula: string;
  GmcoreId: string;
  nome: string;
  setor: string;
  filial: number;
  usuarioInsert: number;
  imagemFacial: any;
};

export async function fetchUsuariosConsumer() {
  const response = await api.get<UsuarioConsumer[]>('/consumer');
  return response.data;
}

export async function createUsuarioConsumer(data: UsuarioConsumer) {
  console.log('Enviando dados para criação do usuário consumer:', data);
    console.log('Buscando usuários consumer... '+ data.imagemFacial);

  const response = await api.post<UsuarioConsumer>('/consumer', data);
  return response.data;
}

export type CriarChavesPayload = {
  armarioId: number;
  quantidade: number;
};

export async function createArmarioChaves(payload: CriarChavesPayload) {
  const response = await api.post('/armario/chaves', payload);
  return response.data;
}

export async function devolverChave(payload: any) {
  const response = await api.post('/entregaChaves/devolucao', payload);
  return response.data;
}

export async function armariosFiliais(filial: any) {
  const params = new URLSearchParams();
  params.append("filial", filial)
  const response = await api.get('/entregaChaves/lista', { params });
  return response.data;
}

export async function buscaBlocoArmario(armarioId: any, tipo: any) {
  const params = new URLSearchParams();
  params.append("armarioId", armarioId)
  params.append("tipo", tipo)
  const response = await api.get('/armario/unico', { params });
  return response.data;
}
export async function detlhesFacial(base64: any) {
  const response = await api.post('/consumer/biometria/user', {base64:base64});
  return response.data;
}
export async function filiaisPermitidas(usuarioId: any) {
  const params = new URLSearchParams();
  params.append("usuarioId", usuarioId)
  const response = await api.get(`/portaria/v1/usuario/busca/filiais`, { params });
  return response.data;
}

export async function ArmariodTop3UltimosEntregue(filial: any) {
  const response = await api.get(`/entregaChaves/top3/${filial}`);
  return response.data;
}

export async function detalhesArmario(filial: any, armarioId: number, chaveNumero: any) {
  console.log('api armárioId:', armarioId, 'chaveNumero:', chaveNumero, 'filial:', filial);
  const response = await api.get(`entregaChaves/detalhes/arm/${armarioId}/chave/${chaveNumero}/filial/${filial}`);
  console.log('Resposta da API detalhesArmario:', response.data);
  return response.data;
}


export async function armOcupadoApi(filial: any, arm: any) {
  const params = new URLSearchParams();
  params.append("filial", filial)
  params.append("arm", arm)
  const response = await api.get('/entregaChaves/ocupados/arm/filial', { params });
  return response.data;
}   
