import { useState, useEffect } from "react"; // <--- Tambah useEffect
import { Card, Button, Input, Modal } from "@/components/ui-components";
import { Plus, Skull, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const createSchema = z.object({
  name: z.string().min(1, "Wajib diisi"),
  totalAmount: z.coerce.number().min(1),
  remainingAmount: z.coerce.number().min(0).optional(),
});
type DebtForm = z.infer<typeof createSchema>;

export default function Debt() {
  const { toast } = useToast();
  
  // 1. LOAD DATA: Cek apakah ada data tersimpan di LocalStorage?
  const [debts, setDebts] = useState(() => {
    const saved = localStorage.getItem("my-debts");
    if (saved) return JSON.parse(saved);
    // Kalau kosong, pakai data default ini:
    return [
      { id: 1, name: "Hutang Jody (Teman)", totalAmount: 3500000, remainingAmount: 3500000 },
    ];
  });

  // 2. SAVE DATA: Setiap kali data 'debts' berubah, simpan ke LocalStorage
  useEffect(() => {
    localStorage.setItem("my-debts", JSON.stringify(debts));
  }, [debts]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DebtForm>({
    resolver: zodResolver(createSchema),
  });

  const onSubmit = (data: DebtForm) => {
    const newDebt = {
      id: Date.now(), // Pakai waktu sekarang biar ID unik
      name: data.name,
      totalAmount: data.totalAmount,
      remainingAmount: data.remainingAmount ?? data.totalAmount
    };
    setDebts([...debts, newDebt]);
    setIsModalOpen(false);
    reset();
  };

  const handlePay = (id: number) => {
    toast({
      title: "Debt Destroyer Berkata:",
      description: "Mantap! Hutang berkurang Rp 50.000.",
      duration: 3000,
    });
    setDebts(debts.map((d: any) => d.id === id ? { ...d, remainingAmount: Math.max(0, d.remainingAmount - 50000) } : d));
  };
  
  // Tambahan: Fitur Hapus Hutang (kalau salah input/sudah lunas)
  const handleDelete = (id: number) => {
    if (confirm("Yakin mau hapus catatan hutang ini?")) {
        setDebts(debts.filter((d: any) => d.id !== id));
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const totalDebt = debts.reduce((acc: number, d: any) => acc + Number(d.remainingAmount), 0);

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6 max-w-lg mx-auto">
      <div className="bg-destructive/10 rounded-3xl p-6 text-center border border-destructive/20 relative overflow-hidden">
        <Skull className="absolute -right-6 -top-6 w-32 h-32 text-destructive/10 rotate-12" />
        <h1 className="text-2xl font-display font-bold text-destructive mb-1">Debt Destroyer</h1>
        <p className="text-3xl font-mono font-bold">{formatRupiah(totalDebt)}</p>
        <p className="text-xs text-muted-foreground mt-2">Total Sisa Hutang</p>
      </div>

      <div className="flex justify-between items-center px-1">
        <h2 className="font-bold">Daftar Hutang</h2>
        <Button size="sm" variant="ghost" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Tambah
        </Button>
      </div>

      <div className="space-y-4">
        {debts.map((debt: any) => {
          const progress = ((Number(debt.totalAmount) - Number(debt.remainingAmount)) / Number(debt.totalAmount)) * 100;
          return (
            <Card key={debt.id} className="relative overflow-hidden group p-4">
               {/* Tombol Hapus Tersembunyi */}
               <button 
                onClick={() => handleDelete(debt.id)}
                className="absolute top-2 right-2 p-1 text-muted-foreground/20 hover:text-red-500 transition-colors z-20"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h3 className="font-bold text-lg">{debt.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Sisa: {formatRupiah(Number(debt.remainingAmount))}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  className="h-8 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => handlePay(debt.id)}
                  disabled={debt.remainingAmount <= 0}
                >
                  Bayar 50k
                </Button>
              </div>

              <div className="space-y-1 relative z-10">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Lunas</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-destructive to-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Catatan Hutang">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Nama Hutang</label>
            <Input {...register("name")} placeholder="Hutang Teman / Laptop" />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Total Awal (Rp)</label>
            <Input type="number" {...register("totalAmount")} placeholder="3500000" />
            {errors.totalAmount && <p className="text-xs text-red-400">{errors.totalAmount.message}</p>}
          </div>
           <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Sisa Sekarang (Rp)</label>
            <Input type="number" {...register("remainingAmount")} placeholder="Jika beda dari total awal" />
          </div>
          <Button type="submit" className="w-full mt-4" variant="destructive">
            Simpan Permanen
          </Button>
        </form>
      </Modal>
    </div>
  );
}

