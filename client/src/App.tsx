import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Allocator from "@/pages/Allocator";
import DebtPage from "@/pages/Debt";
import DumpBinPage from "@/pages/DumpBin";
import AuthPage from "@/pages/auth-page"; // Halaman Login baru
import { AuthProvider, useAuth } from "@/hooks/use-auth"; // Otak Login
import { Loader2 } from "lucide-react"; // Ikon loading

// KOMPONEN SATPAM (Protected Route) 👮‍♂️
// Tugasnya: Cek tiket user. Kalau gak punya tiket, tendang ke /auth
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  // 1. Kalau masih loading (cek tiket ke server), tampilkan spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Kalau tiket gak ada (belum login), lempar ke Auth
  if (!user) {
    return <AuthPage />;
  }

  // 3. Kalau aman, silakan masuk
  return <Component />;
}

// STRUKTUR UTAMA APLIKASI
function Router() {
  return (
    <Switch>
      {/* Halaman Login (Bebas akses) */}
      <Route path="/auth" component={AuthPage} />

      {/* Halaman-halaman Rahasia (Harus Login) */}
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/allocator" component={() => <ProtectedRoute component={Allocator} />} />
      <Route path="/debt" component={() => <ProtectedRoute component={DebtPage} />} />
      <Route path="/dump-bin" component={() => <ProtectedRoute component={DumpBinPage} />} />
      
      {/* Halaman Error 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Bungkus satu aplikasi dengan AuthProvider biar semua komponen tau status login */}
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;