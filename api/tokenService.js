import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const saveTokens = async (accessToken, refreshToken) => {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    console.error("Błąd podczas zapisywania tokenów w SecureStore", error);
  }
};

const getAccessToken = async () => {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error("Błąd podczas pobierania accessToken z SecureStore", error);
    return null;
  }
};

const getRefreshToken = async () => {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Błąd podczas pobierania refreshToken z SecureStore", error);
    return null;
  }
};

const clearTokens = async () => {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Błąd podczas usuwania tokenów z SecureStore", error);
  }
};

export const tokenService = {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
};