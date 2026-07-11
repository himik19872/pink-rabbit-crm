import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export const authService = {
  async login(data: LoginRequest): Promise<AuthTokens> {
    const response = await api.post('/auth/jwt/create/', data);
    const tokens = response.data;
    await AsyncStorage.setItem('access_token', tokens.access);
    await AsyncStorage.setItem('refresh_token', tokens.refresh);
    return tokens;
  },

  async logout() {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
  },

  async isLoggedIn(): Promise<boolean> {
    const token = await AsyncStorage.getItem('access_token');
    return !!token;
  },
};
