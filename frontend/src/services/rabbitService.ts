import api from './api';

export interface Rabbit {
  id: number;
  rabbit_id: string;
  name: string;
  gender: 'M' | 'F';
  birth_date: string;
  age_months: number;
  status: string;
  breed: string;
  mother: number | null;
  father: number | null;
  mother_name?: string;
  father_name?: string;
  current_cage?: string;
  is_breeding_stock: boolean;
  offspring_count?: number;
  notes?: string;
  created_at: string;
}

export interface RabbitFormData {
  name: string;
  gender: 'M' | 'F';
  birth_date: string;
  status: string;
  breed: string;
  mother?: number | null;
  father?: number | null;
  notes?: string;
}

export const rabbitService = {
  async list(params?: Record<string, string>) {
    const response = await api.get('/rabbits/rabbits/', { params });
    return response.data;
  },

  async get(id: number) {
    const response = await api.get(`/rabbits/rabbits/${id}/`);
    return response.data;
  },

  async create(data: RabbitFormData) {
    const response = await api.post('/rabbits/rabbits/', data);
    return response.data;
  },

  async update(id: number, data: Partial<RabbitFormData>) {
    const response = await api.patch(`/rabbits/rabbits/${id}/`, data);
    return response.data;
  },

  async delete(id: number) {
    await api.delete(`/rabbits/rabbits/${id}/`);
  },

  async getWeights(rabbitId: number) {
    const response = await api.get('/rabbits/weights/', { params: { rabbit_id: rabbitId } });
    return response.data;
  },

  async addWeight(data: { rabbit: number; weight: number; method: string }) {
    const response = await api.post('/rabbits/weights/', data);
    return response.data;
  },
};
