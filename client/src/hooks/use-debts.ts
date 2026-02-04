import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertDebt } from "@shared/routes";

// --- FUNGSI BANTUAN PENTING ---
// Ambil token dari saku (LocalStorage) dan bikin header surat jalan
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export function useDebts() {
  return useQuery({
    queryKey: [api.debts.list.path],
    queryFn: async () => {
      // PENTING: Jangan lupa sertakan headers!
      const res = await fetch(api.debts.list.path, { 
        headers: getAuthHeaders() 
      });
      
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch debts");
      
      return api.debts.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertDebt) => {
      const res = await fetch(api.debts.create.path, {
        method: api.debts.create.method,
        // Pakai header yang sudah ada tokennya
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create debt");
      return api.debts.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.debts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.analytics.netWorth.path] });
    },
  });
}

export function usePayDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount }: { id: number; amount: number }) => {
      const url = buildUrl(api.debts.payment.path, { id });
      const res = await fetch(url, {
        method: api.debts.payment.method,
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error("Failed to record payment");
      return api.debts.payment.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.debts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.analytics.netWorth.path] });
    },
  });
}