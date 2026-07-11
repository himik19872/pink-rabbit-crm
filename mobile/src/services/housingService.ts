import api from './api';

export const housingService = {
  async logWater(cageId: number, amountMl: number, notes?: string) {
    const response = await api.post('/housing/water/', {
      cage: cageId,
      amount_ml: amountMl,
      date: new Date().toISOString().split('T')[0],
      notes: notes || '',
    });
    return response.data;
  },

  async logCleaning(cageId: number) {
    const response = await api.patch(`/housing/cages/${cageId}/`, {
      last_cleaned: new Date().toISOString().split('T')[0],
    });
    return response.data;
  },
};
