import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@eraser/api-client";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 10_000, // Poll every 10 seconds for real-time dashboard status
  });
}
