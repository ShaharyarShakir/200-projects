import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../features/auth";
import { ShopProvider } from "../features/shop";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.response?.status === 401 || error?.message?.includes("401")) {
          return false;
        }
        return failureCount < 1;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

interface GlobalProvidersProps {
  children: React.ReactNode;
}

export const GlobalProviders: React.FC<GlobalProvidersProps> = ({
  children,
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ShopProvider>{children}</ShopProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default GlobalProviders;
