import api from './api';

export interface Rabbit {
  id: number;
  rabbit_id: string;
  name: string;
  gender: string;
  birth_date: string;
  age_months: number;
  status: string;
  breed: string;
  mother_name?: string;
  father_name?: string;
  current_cage?: string;
  offspring_count?: number;
}

export interface Cage {
  id: number;
  shelf_address: string;
  number: number;
  capacity: number;
  current_rabbit: number | null;
  current_rabbit_info: string | null;
  address_qr: string;
  rabbit_info?: Rabbit | null;
  last_cleaned: string | null;
  last_disinfected: string | null;
  is_active: boolean;
}

export const rabbitService = {
  async getByCage(cageId: number): Promise<Cage> {
    // QR-скан: получить инфо о клетке и кролике
    const response = await api.get('/housing/cages/scan/', {
      params: { cage_id: cageId },
    });
    return response.data;
  },

  async getRabbit(id: number): Promise<Rabbit> {
    const response = await api.get(`/rabbits/rabbits/${id}/`);
    return response.data;
  },

  async addWeight(data: { rabbit: number; weight: number; method?: string }) {
    const response = await api.post('/rabbits/weights/', {
      ...data,
      method: data.method || 'manual',
    });
    return response.data;
  },

  async getWeights(rabbitId: number) {
    const response = await api.get('/rabbits/weights/', {
      params: { rabbit_id: rabbitId },
    });
    return response.data;
  },
};
