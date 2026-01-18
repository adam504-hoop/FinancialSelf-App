import { useState } from "react";
import { Card } from "@/components/ui-components";
import { Gamepad2, AlertTriangle, PartyPopper } from "lucide-react";
import { motion } from "framer-motion";

export default function Playing() {
  const [budget, setBudget] = useState(100); // Represents 100k normalized
  
  // Helpers for visual feedback
  const getStatus = (val: number) => {
    if (val <= 75) return { label: "Frugal", color: "text-green-400", bg: "bg-green-500/10" };
    if (val <= 125) return { label: "Balanced", color: "text-blue-400", bg: "bg-blue-500/10" };
    return { label: "High Roller", color: "text-red-400", bg: "bg-red-500/10" };
  };

  const status = getStatus(budget);
  const displayAmount = (budget * 1000).toLocaleString();
  const warning = budget > 125;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6 max-w-lg mx-auto min-h-screen flex flex-col justify-center">
      <div className="text-center space-y-2">
        <motion.div
          animate={{ rotate: warning ? [0, -10, 10, 0] : 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex p-4 rounded-full bg-accent/10 text-accent mb-4"
        >
          {warning ? <AlertTriangle className="w-12 h-12" /> : <Gamepad2 className="w-12 h-12" />}
        </motion.div>
        <h1 className="text-3xl font-display font-bold">Variable Budget</h1>
        <p className="text-muted-foreground">Adjust your lifestyle. Feel the impact.</p>
      </div>

      <Card className="space-y-8 py-10">
        <div className="text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold mb-2">Current Mode</p>
          <motion.div 
            key={status.label}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${status.color} ${status.bg}`}
          >
            {status.label}
          </motion.div>
        </div>

        <div className="text-center">
          <span className="text-5xl font-mono font-bold tracking-tighter">
            ${displayAmount}
          </span>
          <span className="text-muted-foreground ml-2">/ month</span>
        </div>

        <div className="px-4">
          <input
            type="range"
            min="50"
            max="200"
            step="5"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            style={{
              background: `linear-gradient(to right, 
                hsl(var(--secondary)) 0%, 
                hsl(var(--primary)) 50%, 
                hsl(var(--destructive)) 100%)`
            }}
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground font-mono">
            <span>$50k</span>
            <span>$200k</span>
          </div>
        </div>

        {warning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex gap-3 items-start"
          >
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive-foreground">
              <strong>Careful!</strong> Spending this much reduces your Emergency Fund contribution by $50,000/yr.
            </p>
          </motion.div>
        )}
        
        {!warning && budget < 80 && (
           <motion.div
           initial={{ opacity: 0, height: 0 }}
           animate={{ opacity: 1, height: "auto" }}
           className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex gap-3 items-start"
         >
           <PartyPopper className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
           <p className="text-sm text-green-100">
             <strong>Great job!</strong> You're saving an extra 15% towards your goals.
           </p>
         </motion.div>
        )}
      </Card>
    </div>
  );
}
