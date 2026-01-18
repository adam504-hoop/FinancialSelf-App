import { useState } from "react";
import { useSmartAllocator } from "@/hooks/use-analytics";
import { Card, Button, Input } from "@/components/ui-components";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function Allocator() {
  const [income, setIncome] = useState<string>("");
  const allocator = useSmartAllocator();
  
  const handleAllocate = () => {
    if (!income || isNaN(Number(income))) return;
    allocator.mutate(Number(income));
  };

  const data = allocator.data ? [
    { name: 'Needs (58%)', value: allocator.data.needs, color: 'hsl(var(--primary))' },
    { name: 'Living (13%)', value: allocator.data.living, color: 'hsl(var(--secondary))' },
    { name: 'Playing (17%)', value: allocator.data.playing, color: 'hsl(var(--accent))' },
    { name: 'Booster (12%)', value: allocator.data.booster, color: '#eab308' }, // Yellow-500
  ] : [];

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6 max-w-lg mx-auto min-h-screen">
      <div className="text-center space-y-2 py-4">
        <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Smart Allocator
        </h1>
        <p className="text-muted-foreground text-sm">Let AI split your paycheck efficiently.</p>
      </div>

      <Card className="border-primary/20 bg-card/50">
        <label className="text-sm font-medium mb-2 block">Weekly Income</label>
        <div className="flex gap-3">
          <Input 
            type="number" 
            placeholder="e.g. 1000" 
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="text-lg font-mono"
          />
          <Button onClick={handleAllocate} isLoading={allocator.isPending} className="px-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Allocate
          </Button>
        </div>
      </Card>

      <AnimatePresence>
        {allocator.data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-6"
          >
            {/* Chart Area */}
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-xl font-bold">${allocator.data.totalIncome.toLocaleString()}</span>
              </div>
            </div>

            {/* Breakdown Cards */}
            <div className="grid grid-cols-2 gap-3">
              {data.map((item) => (
                <motion.div 
                  key={item.name}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 rounded-2xl bg-card border border-white/5 shadow-lg relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: item.color }} />
                  <p className="text-xs text-muted-foreground mb-1">{item.name}</p>
                  <p className="text-lg font-bold font-mono group-hover:text-primary transition-colors">
                    ${item.value.toLocaleString()}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="text-center text-xs text-muted-foreground pt-4">
              * Based on optimal 58/13/17/12 split strategy.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
