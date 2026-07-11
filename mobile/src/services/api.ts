import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_SERVER = 'http://192.168.1.73:8000';
const SERVER_KEY = 'server_url';

// Сохранить URL сервера
export const saveServerUrl = async (url: string): Promise<void> => {
  await AsyncStorage.setItem(SERVER_KEY, url);
};

// Загрузить сохранённый URL сервера
export const loadServerUrl = async (): Promise<string> => {
  const saved = await AsyncStorage.getItem(SERVER_KEY);
  return saved || DEFAULT_SERVER;
};

// Получить полный API URL
export const getApiBaseUrl = async (): Promise<string> => {
  const serverUrl = await loadServerUrl();
  return `${serverUrl}/api`;
};

const api = axios.create({
  baseURL: `${DEFAULT_SERVER}/api`,
  timeout: 10000,
});

// Флаг: был ли URL переопределён после инициализации
let isUrlUpdated = false;

// Обновить baseURL у инстанса axios
export const updateApiBaseUrl = (serverUrl: string): void => {
  const base = `${serverUrl}/api`;
  api.defaults.baseURL = base;
  isUrlUpdated = true;
};

// Запросить обновление URL при старте
export const initApiBaseUrl = async (): Promise<void> => {
  const url = await loadServerUrl();
  updateApiBaseUrl(url);
};

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    }
    return Promise.reject(error);
  }
);

export default api;
