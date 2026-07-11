import api from './api';

export const healthService = {
  async logCheckup(data: {
    rabbit: number;
    description: string;
    event_type?: string;
    notes?: string;
  }) {
    const response = await api.post('/health/events/', {
      ...data,
      date: new Date().toISOString().split('T')[0],
      event_type: data.event_type || 'CHECKUP',
      risk_level: 'LOW',
    });
    return response.data;
  },
};
