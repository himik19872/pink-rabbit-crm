import api from './api';

export interface FeedType {
  id: number;
  name: string;
  category: string;
  description: string;
}

export interface Feed {
  id: number;
  feed_type: number;
  name: string;
  brand: string;
  batch_number: string;
  expiry_date: string;
}

export interface FeedDistribution {
  id: number;
  rabbit: number;
  feed: number;
  quantity: number;
  distribution_date: string;
  time_of_day: string;
  notes: string;
}

export interface FeedPurchase {
  id: number;
  feed: number;
  feed_name: string;
  quantity_kg: number;
  price_per_kg: number;
  total_cost: number;
  purchase_date: string;
  supplier: string;
  invoice_number: string;
  batch_number: string;
  expiry_date: string | null;
  notes: string;
  created_at: string;
}

export const feedingService = {
  async listFeedTypes() { const r = await api.get('/feeding/types/'); return r.data; },
  async listFeeds() { const r = await api.get('/feeding/feeds/'); return r.data; },
  async listDistributions(params?: Record<string, string>) { const r = await api.get('/feeding/distributions/', { params }); return r.data; },
  async createDistribution(data: Partial<FeedDistribution>) { const r = await api.post('/feeding/distributions/', data); return r.data; },

  // Приход кормов
  async listPurchases(params?: Record<string, string>) { const r = await api.get('/feeding/purchases/', { params }); return r.data; },
  async createPurchase(data: Partial<FeedPurchase>) { const r = await api.post('/feeding/purchases/', data); return r.data; },
};
