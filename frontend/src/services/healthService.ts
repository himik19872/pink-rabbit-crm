import api from './api';

export interface HealthEvent {
  id: number;
  rabbit: number;
  event_type: string;
  date: string;
  description: string;
  medication: string;
  dosage: string;
  vet_name: string;
  risk_level: string;
  is_urgent: boolean;
  notes: string;
}

export const healthService = {
  async list(params?: Record<string, string>) { const r = await api.get('/health/events/', { params }); return r.data; },
  async create(data: Partial<HealthEvent>) { const r = await api.post('/health/events/', data); return r.data; },
  async update(id: number, data: Partial<HealthEvent>) { const r = await api.patch(`/health/events/${id}/`, data); return r.data; },
  async delete(id: number) { await api.delete(`/health/events/${id}/`); },
};
