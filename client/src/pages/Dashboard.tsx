import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNetWorth } from "@/hooks/use-analytics";
import { useTransactions, useCreateTransaction } from "@/hooks/use-transactions";

import { Card, Button, Input, Modal } from "@/components/ui-components";
import { Plus, Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTransactionSchema } from "@shared/routes";
import { z } from "zod";

const createSchema = insertTransactionSchema.extend({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
});

type TransactionForm = z.infer<typeof createSchema>;

export default function Dashboard() {
  const { user } = useAuth();
  const { data: netWorth, isLoading: loadingNW } = useNetWorth();
  const { data: transactions, isLoading: loadingTx } = useTransactions();
  const createTx = useCreateTransaction();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TransactionForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      type: "expense",
      category: "needs",
      date: new Date().toISOString(), // Default now, schema ignores if omitted, but let's send for completeness if needed or omit
    }
  });

  const onSubmit = (data: TransactionForm) => {
    createTx.mutate(data, {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      }
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loadingNW || loadingTx) {
    return (
      <div className="p-6 flex flex-col gap-4 animate-pulse">
        <div className="h-32 bg-card rounded-3xl"></div>
        <div className="h-20 bg-card rounded-2xl"></div>
        <div className="h-20 bg-card rounded-2xl"></div>
      </div>
    );
  }

  // Calculate generic "Wallet" balance from transactions for display if needed, 
  // though backend netWorth endpoint provides a breakdown.wallet
  const walletBalance = netWorth?.breakdown?.wallet ?? 0;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display">{getGreeting()}, {user?.firstName || "Friend"}</h1>
          <p className="text-muted-foreground text-sm">FinancialSelf Snapshot</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
          {user?.firstName?.[0] || "U"}
        </div>
      </div>

      {/* Net Worth Reality Check */}
      <Card className="bg-gradient-to-br from-primary/20 via-card to-card border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        
        <div className="relative z-10">
          <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" /> Net Worth
          </p>
          <h2 className="text-4xl font-display font-bold text-foreground">
            ${netWorth?.netWorth.toLocaleString()}
          </h2>
          
          <div className="mt-4 flex gap-4 text-xs font-medium">
            <div className="bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Assets: ${netWorth?.totalAssets.toLocaleString()}
            </div>
            <div className="bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> Debt: ${netWorth?.totalDebt.toLocaleString()}
            </div>
          </div>
        </div>
      </Card>

      {/* Wallet Balance Strip */}
      <div className="flex items-center justify-between bg-card border border-white/5 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Monthly Wallet</p>
            <p className="text-lg font-bold">${walletBalance.toLocaleString()}</p>
          </div>
        </div>
        <Button size="icon" className="rounded-xl h-10 w-10" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-lg font-bold mb-3 px-1">Recent Activity</h3>
        <div className="space-y-3">
          {transactions?.slice(0, 5).map((tx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card p-4 rounded-2xl border border-white/5 flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {tx.type === 'income' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-bold text-sm">{tx.description}</p>
                  <p className="text-xs text-muted-foreground capitalize">{tx.category}</p>
                </div>
              </div>
              <p className={`font-mono font-medium ${tx.type === 'income' ? 'text-green-400' : 'text-foreground'}`}>
                {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toLocaleString()}
              </p>
            </motion.div>
          ))}
          {transactions?.length === 0 && (
            <div className="text-center py-10 text-muted-foreground bg-card/30 rounded-2xl border-dashed border border-white/10">
              No transactions yet. Add one!
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Transaction">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Input {...register("description")} placeholder="Coffee, Salary, etc." />
            {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Amount ($)</label>
            <Input type="number" step="0.01" {...register("amount")} placeholder="0.00" />
            {errors.amount && <p className="text-xs text-red-400">{errors.amount.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <select {...register("type")} className="w-full h-12 rounded-xl bg-background border border-input px-3 text-sm focus:ring-2 focus:ring-primary">
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <select {...register("category")} className="w-full h-12 rounded-xl bg-background border border-input px-3 text-sm focus:ring-2 focus:ring-primary">
                <option value="needs">Needs</option>
                <option value="living">Living</option>
                <option value="playing">Playing</option>
                <option value="booster">Booster</option>
                <option value="debt_payment">Debt Payment</option>
                <option value="savings">Savings</option>
              </select>
            </div>
          </div>

          <Button type="submit" className="w-full mt-4" isLoading={createTx.isPending}>
            Add Transaction
          </Button>
        </form>
      </Modal>
    </div>
  );
}
