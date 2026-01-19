import { useState, useEffect } from "react";
import { Card, Button, Input, Modal } from "@/components/ui-components";
import { Archive, Plus, Coins, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  targetAmount: z.coerce.number().min(1, "Target wajib diisi"),
});
type GoalForm = z.infer<typeof createSchema>;

export default function DumpBin() {
  // 1. LOAD DATA: Ambil dari 'my-dumpbin'
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem("my-dumpbin");
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, name: "Keyboard Mechanical", targetAmount: 800000, currentAmount: 450000, isDumpBin: true },
    ];
  });
  
  // 2. SAVE DATA: Simpan ke 'my-dumpbin'
  useEffect(() => {
    localStorage.setItem("my-dumpbin", JSON.stringify(goals));
  }, [goals]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<GoalForm>({
    resolver: zodResolver(createSchema),
  });

  const onSubmit = (data: GoalForm) => {
    const newGoal = {
      id: Date.now(),
      name: data.name,
      targetAmount: data.targetAmount,
      currentAmount: 0,
      isDumpBin: true
    };
    setGoals([...goals, newGoal]);
    setIsModalOpen(false);
    reset();
  };

  const handleQuickAdd = (id: number) => {
    setGoals(goals.map((g: any) => g.id === id ? { ...g, currentAmount: g.currentAmount + 20000 } : g));
  };

  const handleDelete = (id: number) => {
    if (confirm("Hapus target ini?")) {
        setGoals(goals.filter((g: any) => g.id !== id));
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6 max-w-lg mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold">The Dump Bin</h1>
          <p className="text-muted-foreground text-sm">Lempar sisa recehanmu ke sini.</p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Target Baru
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {goals.map((goal: any) => {
          const progress = Math.min((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100, 100);
          return (
            <motion.div 
              key={goal.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-white/5 rounded-3xl p-4 flex flex-col justify-between h-52 relative group"
            >
              <button 
                onClick={() => handleDelete(goal.id)}
                className="absolute top-3 right-3 text-muted-foreground/50 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div>
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mb-3">
                  <Archive className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm leading-tight mb-1">{goal.name}</h3>
                <p className="text-[10px] text-muted-foreground">
                  {formatRupiah(Number(goal.currentAmount))} / {formatRupiah(Number(goal.targetAmount))}
                </p>
              </div>

              <div className="space-y-3">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-secondary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full text-xs h-8 border-secondary/30 hover:bg-secondary/10 hover:text-secondary"
                  onClick={() => handleQuickAdd(goal.id)}
                >
                  <Coins className="w-3 h-3 mr-1" /> Sisa Bensin (20rb)
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Target Wishlist">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Nama Barang</label>
            <Input {...register("name")} placeholder="Keyboard Baru, Monitor, dll." />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Harga Target (Rp)</label>
            <Input type="number" {...register("targetAmount")} placeholder="500000" />
            {errors.targetAmount && <p className="text-xs text-red-400">{errors.targetAmount.message}</p>}
          </div>
          <Button type="submit" className="w-full mt-4">
            Buat Target Permanen
          </Button>
        </form>
      </Modal>
    </div>
  );
}