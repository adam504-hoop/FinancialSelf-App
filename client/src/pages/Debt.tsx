import { useState } from "react";
import { useDebts, useCreateDebt, usePayDebt } from "@/hooks/use-debts";
import { Card, Button, Input, Modal } from "@/components/ui-components";
import { Plus, Skull } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDebtSchema } from "@shared/routes";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const createSchema = insertDebtSchema.extend({
  totalAmount: z.coerce.number().min(1),
  remainingAmount: z.coerce.number().min(0).optional(),
});
type DebtForm = z.infer<typeof createSchema>;

export default function Debt() {
  const { data: debts, isLoading } = useDebts();
  const createDebt = useCreateDebt();
  const payDebt = usePayDebt();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DebtForm>({
    resolver: zodResolver(createSchema),
  });

  const onSubmit = (data: DebtForm) => {
    const payload = {
      ...data,
      remainingAmount: data.remainingAmount ?? data.totalAmount,
    };
    createDebt.mutate(payload, {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      },
    });
  };

  const handlePay = (id: number) => {
    // Simulasi bayar 50.000 (sesuai budget "Hutang Teman" mingguanmu)
    toast({
      title: "Debt Destroyer Berkata:",
      description: "Mantap! Hutang berkurang Rp 50.000. Jangan jajan terus!",
      duration: 3000,
    });
    payDebt.mutate({ id, amount: 50000 });
  };

  // Helper format Rupiah
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Hitung total hutang. Jika data kosong (awal), kita anggap targetmu 3.5jt untuk visualisasi.
  const realTotalDebt =
    debts?.reduce((acc, d) => acc + Number(d.remainingAmount), 0) || 0;
  // Tampilkan 3.5jt jika belum ada inputan, supaya kamu ingat targetnya!
  const displayTotalDebt =
    realTotalDebt === 0 && !isLoading ? 3500000 : realTotalDebt;

  if (isLoading)
    return <div className="p-10 text-center">Memuat Data Hutang...</div>;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6 max-w-lg mx-auto">
      <div className="bg-destructive/10 rounded-3xl p-6 text-center border border-destructive/20 relative overflow-hidden">
        <Skull className="absolute -right-6 -top-6 w-32 h-32 text-destructive/10 rotate-12" />
        <h1 className="text-2xl font-display font-bold text-destructive mb-1">
          Debt Destroyer
        </h1>
        <p className="text-3xl font-mono font-bold">
          {formatRupiah(displayTotalDebt)}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Sisa Hutang yang Harus Dihancurkan
        </p>
      </div>

      <div className="flex justify-between items-center px-1">
        <h2 className="font-bold">Daftar Hutang</h2>
        <Button size="sm" variant="ghost" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Tambah
        </Button>
      </div>

      <div className="space-y-4">
        {debts && debts.length > 0 ? (
          debts.map((debt) => {
            const progress =
              ((Number(debt.totalAmount) - Number(debt.remainingAmount)) /
                Number(debt.totalAmount)) *
              100;
            return (
              <Card
                key={debt.id}
                className="relative overflow-hidden group p-4"
              >
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
                    isLoading={payDebt.isPending}
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
          })
        ) : (
          <div className="text-center p-8 border-2 border-dashed border-muted rounded-xl">
            <p className="text-muted-foreground mb-4">
              Belum ada hutang tercatat (atau pura-pura lupa?)
            </p>
            <Button variant="outline" onClick={() => setIsModalOpen(true)}>
              Catat Hutang Teman (3.5jt)
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Catatan Hutang"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Nama Hutang
            </label>
            <Input {...register("name")} placeholder="Hutang Teman / Laptop" />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Total Awal (Rp)
            </label>
            <Input
              type="number"
              {...register("totalAmount")}
              placeholder="3500000"
            />
            {errors.totalAmount && (
              <p className="text-xs text-red-400">
                {errors.totalAmount.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Sisa Sekarang (Rp)
            </label>
            <Input
              type="number"
              {...register("remainingAmount")}
              placeholder="Jika beda dari total awal"
            />
          </div>
          <Button
            type="submit"
            className="w-full mt-4"
            variant="destructive"
            isLoading={createDebt.isPending}
          >
            Simpan Hutang
          </Button>
        </form>
      </Modal>
    </div>
  );
}
