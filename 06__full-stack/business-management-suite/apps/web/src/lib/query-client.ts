import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

// Query key factory — keeps cache keys consistent
export const queryKeys = {
  users: {
    all: ['users'] as const,
    byId: (id: string) => ['users', id] as const,
  },
  employees: {
    all: ['employees'] as const,
    byId: (id: string) => ['employees', id] as const,
  },
  inventory: {
    all: ['inventory'] as const,
    lowStock: ['inventory', 'low-stock'] as const,
  },
  customers: {
    all: ['customers'] as const,
  },
  attendance: {
    all: ['attendance'] as const,
    byEmployee: (id: string) => ['attendance', 'employee', id] as const,
  },
  reports: {
    dashboard: ['reports', 'dashboard'] as const,
  },
};
