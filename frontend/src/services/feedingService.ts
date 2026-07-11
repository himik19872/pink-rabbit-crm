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

export const feedingService = {
  async listFeedTypes() { const r = await api.get('/feeding/types/'); return r.data; },
  async listFeeds() { const r = await api.get('/feeding/feeds/'); return r.data; },
  async listDistributions(params?: Record<string, string>) { const r = await api.get('/feeding/distributions/', { params }); return r.data; },
  async createDistribution(data: Partial<FeedDistribution>) { const r = await api.post('/feeding/distributions/', data); return r.data; },
};
