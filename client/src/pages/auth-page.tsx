import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiReact } from "react-icons/si"; // Icon hiasan

// Schema validasi form
const authSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  // Kalau sudah login, tendang ke Dashboard
  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* BAGIAN KIRI: FORM */}
      <div className="flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md border-none shadow-none lg:border lg:shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Financial Self
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Kelola uangmu, raih mimpimu.
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Masuk</TabsTrigger>
                <TabsTrigger value="register">Daftar</TabsTrigger>
              </TabsList>

              {/* TAB LOGIN */}
              <TabsContent value="login">
                <AuthForm 
                  mode="login" 
                  onSubmit={(data) => loginMutation.mutateAsync(data)} 
                />
              </TabsContent>

              {/* TAB REGISTER */}
              <TabsContent value="register">
                <AuthForm 
                  mode="register" 
                  onSubmit={(data) => registerMutation.mutateAsync(data)} 
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* BAGIAN KANAN: GAMBAR HERO (Hanya muncul di Layar Besar) */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-slate-900 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-900/20" />
        <div className="relative z-10 max-w-lg text-center">
            <h1 className="text-4xl font-bold mb-6">Mulai Perjalanan Finansialmu</h1>
            <p className="text-lg text-slate-300 leading-relaxed">
                "Bukan seberapa banyak uang yang kamu hasilkan, tapi seberapa baik kamu mengelolanya."
            </p>
            <div className="mt-12 grid grid-cols-3 gap-8 opacity-70">
                <div className="text-center">
                    <div className="text-2xl font-bold mb-2">Catat</div>
                    <div className="text-sm">Pemasukan & Pengeluaran</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold mb-2">Pantau</div>
                    <div className="text-sm">Hutang & Tabungan</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold mb-2">Analisis</div>
                    <div className="text-sm">Kesehatan Keuangan</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

// KOMPONEN FORM (Biar rapi dipisah)
function AuthForm({ mode, onSubmit }: { mode: "login" | "register", onSubmit: (data: any) => Promise<void> }) {
  const form = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: { username: "", password: "" },
  });

  const handleSubmit = async (data: z.infer<typeof authSchema>) => {
    try {
      await onSubmit(data);
    } catch (error: any) {
      // Error handled by AuthProvider toast, but we can shake inputs here if needed
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="jody_si_pengutang" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="******" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full mt-4" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Loading..." : (mode === "login" ? "Masuk Sekarang" : "Buat Akun")}
        </Button>
      </form>
    </Form>
  );
}