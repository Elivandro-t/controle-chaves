import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_TOKEN_KEY = 'authToken';
export const USER_ID_KEY = 'userId';
export const SELECTED_FILIAL_KEY = 'selectedFilial';

export async function getAuthToken() {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string) {
  return AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function setUserId(userId: string) {
  return AsyncStorage.setItem(USER_ID_KEY, userId);
}

export async function getUserId() {
  return AsyncStorage.getItem(USER_ID_KEY);
}

export async function getSelectedFilial() {
  const value = await AsyncStorage.getItem(SELECTED_FILIAL_KEY);
  return value ? Number(value) : null;
}

export async function clearAuthStorage() {
  return AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_ID_KEY, SELECTED_FILIAL_KEY]);
}
