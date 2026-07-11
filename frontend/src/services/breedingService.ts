import api from './api';

export interface BreedingPair {
  id: number;
  male: number;
  male_name: string;
  female: number;
  female_name: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  notes: string;
}

export interface Mating {
  id: number;
  pair: number;
  pair_info: string;
  mating_date: string;
  method: string;
  success: boolean;
  notes: string;
}

export interface Pregnancy {
  id: number;
  female: number;
  female_name: string;
  mating_date: string;
  expected_due_date: string;
  confirmed: boolean;
  is_complete: boolean;
}

export interface Kindling {
  id: number;
  female: number;
  female_name: string;
  kindling_date: string;
  litter_size: number;
  live_born: number;
  stillborn: number;
  survival_rate: number;
  notes: string;
}

export interface GenealogicalLine {
  id: number;
  name: string;
  line_type: string;
  founder: number;
  founder_name: string;
  founder_rabbit_id: string;
  description: string;
  is_active: boolean;
  member_count: number;
}

export const breedingService = {
  // Pairs
  async listPairs(params?: Record<string, string>) { const r = await api.get('/breeding/pairs/', { params }); return r.data; },
  async createPair(data: { male: number; female: number }) { const r = await api.post('/breeding/pairs/', data); return r.data; },

  // Matings
  async listMatings(params?: Record<string, string>) { const r = await api.get('/breeding/matings/', { params }); return r.data; },
  async createMating(data: { pair: number; mating_date: string; method: string; success: boolean }) { const r = await api.post('/breeding/matings/', data); return r.data; },

  // Pregnancies
  async listPregnancies(params?: Record<string, string>) { const r = await api.get('/breeding/pregnancies/', { params }); return r.data; },
  async createPregnancy(data: { female: number; mating_date: string }) { const r = await api.post('/breeding/pregnancies/', data); return r.data; },

  // Kindlings
  async listKindlings(params?: Record<string, string>) { const r = await api.get('/breeding/kindlings/', { params }); return r.data; },
  async createKindling(data: { female: number; kindling_date: string; litter_size: number; live_born: number; stillborn: number }) { const r = await api.post('/breeding/kindlings/', data); return r.data; },

  // Lines
  async listLines(params?: Record<string, string>) { const r = await api.get('/breeding/lines/', { params }); return r.data; },
  async createLine(data: { name: string; line_type: string; founder: number; description?: string }) { const r = await api.post('/breeding/lines/', data); return r.data; },
};
