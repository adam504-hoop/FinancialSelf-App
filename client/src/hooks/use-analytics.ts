import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useNetWorth() {
  return useQuery({
    queryKey: [api.analytics.netWorth.path],
    queryFn: async () => {
      const res = await fetch(api.analytics.netWorth.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch net worth");
      return api.analytics.netWorth.responses[200].parse(await res.json());
    },
  });
}

export function useSmartAllocator() {
  return useMutation({
    mutationFn: async (income: number) => {
      const res = await fetch(api.analytics.allocator.path, {
        method: api.analytics.allocator.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ income }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to run allocator");
      return api.analytics.allocator.responses[200].parse(await res.json());
    },
  });
}
