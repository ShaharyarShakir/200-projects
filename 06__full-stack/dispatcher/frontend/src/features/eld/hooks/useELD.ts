import { useMutation, useQuery } from '@tanstack/react-query';
import { eldApi } from '../api/eldApi';
import type { ELDGeneratePayload, ELDGenerateResponse } from '../types/eld';

export const useGenerateELDLogs = () => {
  return useMutation<ELDGenerateResponse, Error, ELDGeneratePayload>({
    mutationFn: (payload: ELDGeneratePayload) => eldApi.generateLogs(payload),
  });
};

export const useDailyLogs = (tripId?: string) => {
  return useQuery<ELDGenerateResponse, Error>({
    queryKey: ['eld', tripId],
    queryFn: () => eldApi.getDailyLogs(tripId!),
    enabled: Boolean(tripId),
  });
};
