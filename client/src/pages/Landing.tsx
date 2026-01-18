import { Button } from "@/components/ui-components";
import { Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="mb-8 relative"
      >
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <Sparkles className="w-20 h-20 text-primary relative z-10 mx-auto" />
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-5xl md:text-6xl font-display font-bold mb-4 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent"
      >
        FinancialSelf
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-xl text-muted-foreground max-w-sm mb-12"
      >
        Master your money with personality. Smart allocation, debt destruction, and guilt-free playing.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-xs space-y-4"
      >
        <Button 
          className="w-full h-14 text-lg bg-white text-black hover:bg-white/90 shadow-xl shadow-white/10"
          onClick={() => window.location.href = "/api/login"}
        >
          Login with Replit <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          Powered by Replit Auth & AI
        </p>
      </motion.div>
    </div>
  );
}
