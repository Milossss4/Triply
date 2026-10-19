import axios from "axios";
import { router } from "expo-router";
import { tokenService } from './tokenService';

const API_BASE_URL_DEPOT = "http://10.5.3.120:8080/api";
const API_BASE_URL_DOM = "http://192.168.1.17:8080/api";
const API_BASE_URL_RENDER = process.env.EXPO_PUBLIC_RENDER;

const apiClient = axios.create({
    baseURL: API_BASE_URL_DOM
});


const excludedUrls = ['/auth/signup', '/auth/signin', '/auth/refresh'];


apiClient.interceptors.request.use(async (config) => {
    const token = await tokenService.getAccessToken();
    
    const isExcluded = excludedUrls.some(url => config.url?.includes(url));

    if (token && config.url && !isExcluded) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// Flaga zapobiegająca wielokrotnym próbom odświeżenia
let isRefreshing = false; 
// Kolejka żądań, które oczekują na nowy token
let failedQueue = [];

// Funkcja do przetwarzania kolejki po odświeżeniu tokena
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.config.headers['Authorization'] = `Bearer ${token}`;
      prom.resolve(apiClient(prom.config));
    }
  });
  failedQueue = []; 
};

apiClient.interceptors.response.use(response => {
    return response;
}, async error => {
    const originalRequest = error.config;

    const isAuthRequest = excludedUrls.some(url => originalRequest.url?.includes(url));

    //Sprawdzenie czy status błędu to 401 (Unauthorized)
    if (error.response?.status === 401 && !isAuthRequest) {
        
        //Jeśli już odświeżamy dodajemy nowe zapytanie api do kolejki
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject, config: originalRequest }); 
            });
        }

        isRefreshing = true;

        //Pobranie nowych tokenów oraz ich zapis 
        try {
            const refreshToken = await tokenService.getRefreshToken();
            if (!refreshToken) {
                console.log("Brak refresh tokena. Wylogowywanie.");
                await tokenService.clearTokens();
                router.replace('/auth/signin');
                return Promise.reject(error);
            }

            const response = await apiClient.post('/auth/refresh', {
                refreshToken: refreshToken
            });

            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
            
            await tokenService.saveTokens(newAccessToken, newRefreshToken);

            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

            processQueue(null, newAccessToken);

            return apiClient(originalRequest);

        } catch (refreshError) {
            console.error("Nie można odświeżyć tokena:", refreshError);
            processQueue(refreshError, null);
            await tokenService.clearTokens();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }

    //Obsługa pozostałych błędów
    let message = "Wystąpił nieoczekiwany błąd serwera. Spróbuj ponownie później.";

    if (axios.isAxiosError(error)) {
        if (error.response && error.response.data && error.response.data.message) {
            message = error.response.data.message;
        } else if (error.response) {
            if (error.response.status !== 401) {
                message = "Błąd połączenia z serwerem";
            }
        }
    }

    error.message = message;
    return Promise.reject(error);
});

export default apiClient;
