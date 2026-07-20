import { api } from '../../../lib/api';
import type { ELDGeneratePayload, ELDGenerateResponse } from '../types/eld';

export const eldApi = {
  generateLogs: async (payload: ELDGeneratePayload): Promise<ELDGenerateResponse> => {
    const response = await api.post('/eld/generate', payload);
    return response.data;
  },

  getDailyLogs: async (tripId: string): Promise<ELDGenerateResponse> => {
    const response = await api.get(`/eld/${tripId}`);
    return response.data;
  },

  getPDFDownloadUrl: (tripId: string): string => {
    const baseUrl = api.defaults.baseURL || '/api';
    return `${baseUrl}/eld/${tripId}/pdf`;
  }
};
