import { useState, useMemo } from "react";
import { Card, Button, Input } from "@/components/ui-components";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Calculator } from "lucide-react";

export default function Allocator() {
  // Kita set default langsung ke 720000 sesuai income mingguanmu
  const [income, setIncome] = useState<string>("720000");
  const [showResult, setShowResult] = useState(false);

  // Logika "Smart Allocator" (58/13/17/12) kita taruh di sini agar instan
  const data = useMemo(() => {
    const total = Number(income) || 0;
    return [
      {
        name: "Needs (58%)",
        value: total * 0.58,
        color: "hsl(var(--primary))",
      }, // Rp 417.600
      {
        name: "Living (13%)",
        value: total * 0.13,
        color: "hsl(var(--secondary))",
      }, // Rp 93.600
      {
        name: "Playing (17%)",
        value: total * 0.17,
        color: "hsl(var(--accent))",
      }, // Rp 122.400
      { name: "Booster (12%)", value: total * 0.12, color: "#eab308" }, // Rp 86.400 (Sisa/Tabungan)
    ];
  }, [income]);

  const handleAllocate = () => {
    if (!income || isNaN(Number(income))) return;
    setShowResult(true);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6 max-w-lg mx-auto min-h-screen">
      <div className="text-center space-y-2 py-4">
        <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Smart Allocator
        </h1>
        <p className="text-muted-foreground text-sm">
          Otomatis bagi gaji mingguanmu.
        </p>
      </div>

      <Card className="border-primary/20 bg-card/50 p-4">
        <label className="text-sm font-medium mb-2 block">
          Pemasukan Mingguan (IDR)
        </label>
        <div className="flex gap-3">
          <Input
            type="number"
            placeholder="Contoh: 720000"
            value={income}
            onChange={(e) => {
              setIncome(e.target.value);
              setShowResult(false); // Reset chart jika angka berubah
            }}
            className="text-lg font-mono"
          />
          <Button onClick={handleAllocate} className="px-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Hitung
          </Button>
        </div>
      </Card>

      <AnimatePresence>
        {(showResult || income === "720000") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-6"
          >
            {/* Area Grafik */}
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
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderRadius: "12px",
                      border: "1px solid hsl(var(--border))",
                    }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [formatRupiah(value), ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-xl font-bold">
                  {formatRupiah(Number(income))}
                </span>
              </div>
            </div>

            {/* Kartu Rincian */}
            <div className="grid grid-cols-2 gap-3">
              {data.map((item) => (
                <motion.div
                  key={item.name}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 rounded-2xl bg-card border border-white/5 shadow-lg relative overflow-hidden group"
                >
                  <div
                    className="absolute top-0 left-0 w-1 h-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <p className="text-xs text-muted-foreground mb-1">
                    {item.name}
                  </p>
                  <p className="text-sm font-bold font-mono group-hover:text-primary transition-colors">
                    {formatRupiah(item.value)}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="text-center text-xs text-muted-foreground pt-4 bg-muted/20 p-2 rounded-lg">
              * Menggunakan strategi 58/13/17/12 <br />
              "Stop pusing mikirin persenan manual!"
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
