import api from './api';

export const feedingService = {
  async logDistribution(data: {
    rabbit: number;
    feed: number;
    quantity: number;
    time_of_day?: string;
    notes?: string;
  }) {
    const response = await api.post('/feeding/distributions/', {
      ...data,
      distribution_date: new Date().toISOString().split('T')[0],
      time_of_day: data.time_of_day || 'MORNING',
    });
    return response.data;
  },
};
