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
  female_id: string;
  male: number | null;
  male_name: string | null;
  male_rabbit_id: string | null;
  mating_date: string;
  expected_due_date: string;
  actual_due_date: string | null;
  confirmed: boolean;
  is_complete: boolean;
  remaining_days: number | null;
  ultrasound_date: string | null;
  embryos_count: number | null;
  created_at: string;
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
  async createPair(data: { male: number; female: number; status?: string }) { const r = await api.post('/breeding/pairs/', data); return r.data; },
  async updatePair(id: number, data: Partial<BreedingPair>) { const r = await api.patch(`/breeding/pairs/${id}/`, data); return r.data; },
  async deletePair(id: number) { await api.delete(`/breeding/pairs/${id}/`); },

  // Matings
  async listMatings(params?: Record<string, string>) { const r = await api.get('/breeding/matings/', { params }); return r.data; },
  async createMating(data: { pair: number; mating_date: string; method: string; success: boolean }) { const r = await api.post('/breeding/matings/', data); return r.data; },
  async updateMating(id: number, data: any) { const r = await api.patch(`/breeding/matings/${id}/`, data); return r.data; },
  async deleteMating(id: number) { await api.delete(`/breeding/matings/${id}/`); },

  // Pregnancies
  async listPregnancies(params?: Record<string, string>) { const r = await api.get('/breeding/pregnancies/', { params }); return r.data; },
  async createPregnancy(data: { female: number; mating_date: string }) { const r = await api.post('/breeding/pregnancies/', data); return r.data; },
  async updatePregnancy(id: number, data: any) { const r = await api.patch(`/breeding/pregnancies/${id}/`, data); return r.data; },
  async deletePregnancy(id: number) { await api.delete(`/breeding/pregnancies/${id}/`); },

  // Kindlings
  async listKindlings(params?: Record<string, string>) { const r = await api.get('/breeding/kindlings/', { params }); return r.data; },
  async createKindling(data: { female: number; kindling_date: string; litter_size: number; live_born: number; stillborn: number }) { const r = await api.post('/breeding/kindlings/', data); return r.data; },
  async updateKindling(id: number, data: any) { const r = await api.patch(`/breeding/kindlings/${id}/`, data); return r.data; },
  async deleteKindling(id: number) { await api.delete(`/breeding/kindlings/${id}/`); },

  // Lines
  async listLines(params?: Record<string, string>) { const r = await api.get('/breeding/lines/', { params }); return r.data; },
  async createLine(data: { name: string; line_type: string; founder: number; description?: string }) { const r = await api.post('/breeding/lines/', data); return r.data; },
  async updateLine(id: number, data: any) { const r = await api.patch(`/breeding/lines/${id}/`, data); return r.data; },
  async deleteLine(id: number) { await api.delete(`/breeding/lines/${id}/`); },

  // Promote young rabbits
  async promoteYoung(status: string = 'MEAT') { const r = await api.post(`/breeding/kindlings/promote_young/?status=${status}`); return r.data; },
};
