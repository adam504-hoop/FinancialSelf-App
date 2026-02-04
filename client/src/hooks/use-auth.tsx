import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Tipe data User
type User = {
  id: number | null;
  username: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  loginMutation: {
    mutateAsync: (credentials: any) => Promise<void>;
    isPending: boolean;
  };
  logoutMutation: {
    mutate: () => void;
  };
  registerMutation: {
    mutateAsync: (credentials: any) => Promise<void>;
    isPending: boolean;
  };
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useLocation();

  // 1. Cek apakah User sudah login saat website dibuka?
  useEffect(() => {
    const checkLogin = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          // Token kadaluarsa/salah
          localStorage.removeItem("token");
          setUser(null);
        }
      } catch (error) {
        console.error("Gagal cek login:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkLogin();
  }, []);

  // 2. Fungsi Login (Minta Token ke Python)
  const loginMutation = {
    isPending: false, // Simplifikasi tanpa React Query biar ringan
    mutateAsync: async (credentials: any) => {
      // Python butuh Form Data, bukan JSON!
      const formData = new URLSearchParams();
      formData.append("username", credentials.username);
      formData.append("password", credentials.password);

      const res = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Login gagal");
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token); // Simpan tiket
      
      // Ambil data user setelah dapat tiket
      const userRes = await fetch("/api/user", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const userData = await userRes.json();
      
      setUser(userData);
      toast({ title: "Berhasil Login", description: "Selamat datang kembali!" });
    },
  };

  // 3. Fungsi Logout (Buang Tiket)
  const logoutMutation = {
    mutate: () => {
      localStorage.removeItem("token");
      setUser(null);
      setLocation("/auth");
      toast({ title: "Logout Berhasil" });
    },
  };

  // 4. Fungsi Register
  const registerMutation = {
    isPending: false,
    mutateAsync: async (credentials: any) => {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials), // Register tetap pakai JSON
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Register gagal");
      }

      toast({ title: "Register Berhasil", description: "Silakan login sekarang" });
      // Otomatis login setelah register? Opsional, kita manual dulu.
    },
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}