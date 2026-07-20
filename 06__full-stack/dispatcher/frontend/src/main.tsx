import { StrictMode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './features/auth/context/AuthContext';
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
    },
  },
});
createRoot(document.getElementById('root')!).render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>

  <StrictMode>
    <App />
  </StrictMode>
  </AuthProvider>
    <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>

)
