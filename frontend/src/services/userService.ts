import api from './api';

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface CreateUserRequest {
  username: string;
  email?: string;
  password: string;
  is_staff?: boolean;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  is_staff?: boolean;
  is_active?: boolean;
}

const BASE = '/users';

export const userService = {
  async list(): Promise<UserInfo[]> {
    const response = await api.get(`${BASE}/`);
    return response.data.results || response.data;
  },

  async get(id: number): Promise<UserInfo> {
    const response = await api.get(`${BASE}/${id}/`);
    return response.data;
  },

  async create(data: CreateUserRequest): Promise<UserInfo> {
    const response = await api.post(`${BASE}/`, data);
    return response.data;
  },

  async update(id: number, data: UpdateUserRequest): Promise<UserInfo> {
    const response = await api.patch(`${BASE}/${id}/`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}/`);
  },

  async changePassword(id: number, password: string): Promise<void> {
    await api.post(`${BASE}/${id}/change_password/`, { password });
  },
};
