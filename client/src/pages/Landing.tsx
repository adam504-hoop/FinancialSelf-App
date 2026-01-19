import { useAuth } from "@/hooks/use-auth";
import { Button, Card } from "@/components/ui-components";
import { Redirect } from "wouter";
import { Sparkles, ShieldCheck, Wallet, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  const { user, loginMutation } = useAuth();

  // Kalau sudah login, langsung lempar ke Dashboard
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background -z-10" />

      {/* 1. Header & Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center space-y-4 max-w-md mx-auto mt-10"
      >
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4 ring-1 ring-primary/20">
          <Wallet className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
          CatatMoney
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Gak perlu jago matematika buat jadi kaya.
          <br />
          <span className="text-primary font-medium">Smart Allocator</span> yang
          atur gajimu.
        </p>
      </motion.div>

      {/* 2. Fitur Highlight (Carousel Kecil) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="grid grid-cols-1 gap-4 w-full max-w-sm my-10"
      >
        <Card className="p-4 bg-card/50 border-white/5 flex items-center gap-4">
          <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-sm">Otomatis 58/13/17/12</h3>
            <p className="text-xs text-muted-foreground">
              Input gaji, langsung bagi pos.
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-card/50 border-white/5 flex items-center gap-4">
          <div className="bg-red-500/10 p-2 rounded-lg text-red-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-sm">Debt Destroyer</h3>
            <p className="text-xs text-muted-foreground">
              Lacak & hancurkan hutangmu.
            </p>
          </div>
        </Card>
      </motion.div>

      {/* 3. Login Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-xs mb-8"
      >
        <Button
          size="lg"
          className="w-full text-lg h-12 font-bold shadow-xl shadow-primary/20"
          onClick={() => loginMutation.mutate()}
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Masuk..." : "Mulai Sekarang"}
          <ArrowRight className="w-5 h-5 ml-2 opacity-80" />
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-4">
          Gratis. Data aman. Tanpa ribet.
        </p>
      </motion.div>
    </div>
  );
}
