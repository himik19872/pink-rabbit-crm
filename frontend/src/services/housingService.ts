import api from './api';

export interface Cage {
  id: number;
  shelf: number;
  shelf_address: string;
  number: number;
  capacity: number;
  current_rabbit: number | null;
  current_rabbit_info: string | null;
  last_cleaned: string | null;
  last_disinfected: string | null;
  is_active: boolean;
  address_qr: string;
  qr_code_url?: string;
  rabbit_info?: Record<string, unknown> | null;
  created_at: string;
}

export interface Building {
  id: number;
  name: string;
  address: string;
  description: string;
}

export interface Row {
  id: number;
  building: number;
  building_name: string;
  number: number;
  description: string;
}

export interface Shelf {
  id: number;
  row: number;
  row_address: string;
  number: number;
  description: string;
}

export const housingService = {
  // Buildings
  async listBuildings() { const r = await api.get('/housing/buildings/'); return r.data; },
  async createBuilding(data: Omit<Building, 'id'>) { const r = await api.post('/housing/buildings/', data); return r.data; },

  // Rows
  async listRows(building?: number) { const r = await api.get('/housing/rows/', { params: building ? { building } : {} }); return r.data; },

  // Shelves
  async listShelves(row?: number) { const r = await api.get('/housing/shelves/', { params: row ? { row } : {} }); return r.data; },

  // Cages
  async listCages(params?: Record<string, string>) { const r = await api.get('/housing/cages/', { params }); return r.data; },
  async getCage(id: number): Promise<Cage> { const r = await api.get(`/housing/cages/${id}/`); return r.data; },
  async createCage(data: { shelf: number; number: number; capacity: number }) { const r = await api.post('/housing/cages/', data); return r.data; },
  async assignRabbit(cageId: number, rabbitId: number, reason?: string) { const r = await api.post(`/housing/cages/${cageId}/assign/`, { rabbit_id: rabbitId, reason }); return r.data; },
  async clearCage(cageId: number) { const r = await api.post(`/housing/cages/${cageId}/clear/`); return r.data; },
  async scanCage(cageId: number): Promise<Cage> { const r = await api.get('/housing/cages/scan/', { params: { cage_id: cageId } }); return r.data; },

  // Water
  async listWater(params?: Record<string, string>) { const r = await api.get('/housing/water/', { params }); return r.data; },
  async addWater(data: { cage: number; amount_ml: number; date: string }) { const r = await api.post('/housing/water/', data); return r.data; },
};
