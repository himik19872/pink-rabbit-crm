import api from './api';

const AUTH_URL = '/auth';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export const authService = {
  async login(data: LoginRequest): Promise<AuthTokens> {
    const response = await api.post(`${AUTH_URL}/jwt/create/`, data);
    return response.data;
  },

  async refreshToken(refresh: string): Promise<{ access: string }> {
    const response = await api.post(`${AUTH_URL}/jwt/refresh/`, { refresh });
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get(`${AUTH_URL}/users/me/`);
    return response.data;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};
