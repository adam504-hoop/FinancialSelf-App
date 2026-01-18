import { useState } from "react";
import { useDebts, useCreateDebt, usePayDebt } from "@/hooks/use-debts";
import { Card, Button, Input, Modal } from "@/components/ui-components";
import { AlertTriangle, Plus, CheckCircle2, Skull } from "lucide-react";
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
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DebtForm>({
    resolver: zodResolver(createSchema),
  });

  const onSubmit = (data: DebtForm) => {
    // If remaining not set, assume full amount is remaining
    const payload = { ...data, remainingAmount: data.remainingAmount ?? data.totalAmount };
    createDebt.mutate(payload, {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      }
    });
  };

  const handlePay = (id: number) => {
    // Simulating a payment dialog would be better, but for MVP just pay fixed amount or add logic
    // For this demo, let's just trigger a toast warning "cheeky personality"
    toast({
      title: "Debt Destroyer says:",
      description: "Finally! Less latte, more payments. Paying $100...",
      duration: 3000,
    });
    payDebt.mutate({ id, amount: 100 });
  };

  const totalDebt = debts?.reduce((acc, d) => acc + Number(d.remainingAmount), 0) || 0;

  if (isLoading) return <div className="p-10">Loading Debts...</div>;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6 max-w-lg mx-auto">
      <div className="bg-destructive/10 rounded-3xl p-6 text-center border border-destructive/20 relative overflow-hidden">
        <Skull className="absolute -right-6 -top-6 w-32 h-32 text-destructive/10 rotate-12" />
        <h1 className="text-2xl font-display font-bold text-destructive mb-1">Debt Destroyer</h1>
        <p className="text-2xl font-mono font-bold">${totalDebt.toLocaleString()} Left</p>
      </div>

      <div className="flex justify-between items-center px-1">
        <h2 className="font-bold">Active Debts</h2>
        <Button size="sm" variant="ghost" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      <div className="space-y-4">
        {debts?.map((debt) => {
          const progress = ((Number(debt.totalAmount) - Number(debt.remainingAmount)) / Number(debt.totalAmount)) * 100;
          return (
            <Card key={debt.id} className="relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h3 className="font-bold text-lg">{debt.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    ${Number(debt.remainingAmount).toLocaleString()} remaining
                  </p>
                </div>
                <Button 
                  size="sm" 
                  className="h-8 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => handlePay(debt.id)}
                  isLoading={payDebt.isPending}
                >
                  Pay $100
                </Button>
              </div>

              <div className="space-y-1 relative z-10">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Debt">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input {...register("name")} placeholder="Student Loan, Visa, etc." />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Total Original Amount ($)</label>
            <Input type="number" {...register("totalAmount")} placeholder="5000" />
            {errors.totalAmount && <p className="text-xs text-red-400">{errors.totalAmount.message}</p>}
          </div>
           <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Current Remaining ($)</label>
            <Input type="number" {...register("remainingAmount")} placeholder="Optional (defaults to total)" />
          </div>
          <Button type="submit" className="w-full mt-4" variant="destructive" isLoading={createDebt.isPending}>
            Add Debt
          </Button>
        </form>
      </Modal>
    </div>
  );
}
