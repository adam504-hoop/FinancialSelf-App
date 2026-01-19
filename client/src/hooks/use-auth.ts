// --- FILE INI DIMODIFIKASI UNTUK MODE DESAIN (OFFLINE) ---
// Tujuannya agar bisa langsung masuk Dashboard tanpa Login/Database.

import { useMutation } from "@tanstack/react-query";

export function useAuth() {
  // Kita "Hardcode" data usernya agar aplikasi mengira kita sudah login
  const dummyUser = {
    id: 1,
    username: "Juragan",
    password: "password",
    isGuest: false
  };

  return {
    user: dummyUser,      // <--- Pura-pura ada user
    isLoading: false,     // <--- Gak perlu loading
    isAuthenticated: true,
    
    // Fungsi Dummy biar tombol gak error kalau dipencet
    logout: () => console.log("Logout diklik (Mode Desain)"),
    loginMutation: { 
      mutate: () => console.log("Login diklik (Mode Desain)"),
      isPending: false 
    } 
  };
}