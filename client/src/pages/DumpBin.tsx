import { useState } from "react";
import { useGoals, useCreateGoal, useContributeGoal, useDeleteGoal } from "@/hooks/use-goals";
import { Card, Button, Input, Modal } from "@/components/ui-components";
import { Archive, Plus, Coins, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGoalSchema } from "@shared/routes";
import { z } from "zod";

const createSchema = insertGoalSchema.extend({
  targetAmount: z.coerce.number().min(1, "Target needed"),
});
type GoalForm = z.infer<typeof createSchema>;

export default function DumpBin() {
  const { data: goals, isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const contribute = useContributeGoal();
  const deleteGoal = useDeleteGoal();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<GoalForm>({
    resolver: zodResolver(createSchema),
  });

  const onSubmit = (data: GoalForm) => {
    createGoal.mutate({ ...data, isDumpBin: true }, {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      }
    });
  };

  const handleQuickAdd = (id: number) => {
    contribute.mutate({ id, amount: 20 }); // Quick add $20
  };

  if (isLoading) return <div className="p-10 text-center">Loading Bin...</div>;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6 max-w-lg mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold">The Dump Bin</h1>
          <p className="text-muted-foreground text-sm">Dump your change here.</p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Item
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {goals?.filter(g => g.isDumpBin).map((goal) => {
          const progress = Math.min((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100, 100);
          return (
            <motion.div 
              key={goal.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-white/5 rounded-3xl p-4 flex flex-col justify-between h-48 relative group"
            >
              <button 
                onClick={() => deleteGoal.mutate(goal.id)}
                className="absolute top-3 right-3 text-muted-foreground/50 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div>
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mb-3">
                  <Archive className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm leading-tight">{goal.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  ${Number(goal.currentAmount).toLocaleString()} / ${Number(goal.targetAmount).toLocaleString()}
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
                  isLoading={contribute.isPending}
                >
                  <Coins className="w-3 h-3 mr-1" /> Add $20
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {goals?.filter(g => g.isDumpBin).length === 0 && (
        <div className="text-center py-20 opacity-50">
          <Archive className="w-12 h-12 mx-auto mb-2" />
          <p>No items in the bin yet.</p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Wishlist Item">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Item Name</label>
            <Input {...register("name")} placeholder="PS5, New Guitar, etc." />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Target Price ($)</label>
            <Input type="number" {...register("targetAmount")} placeholder="500" />
            {errors.targetAmount && <p className="text-xs text-red-400">{errors.targetAmount.message}</p>}
          </div>
          <Button type="submit" className="w-full mt-4" isLoading={createGoal.isPending}>
            Create Goal
          </Button>
        </form>
      </Modal>
    </div>
  );
}
