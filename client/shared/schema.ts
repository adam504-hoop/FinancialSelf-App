import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export Auth Models
export * from "./models/auth";
export * from "./models/chat";

import { users } from "./models/auth";

// === FINANCE TABLES ===

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Links to auth users.id (which is varchar)
  amount: numeric("amount").notNull(),
  type: text("type").notNull(), // 'income' | 'expense'
  category: text("category").notNull(), // 'needs', 'living', 'playing', 'booster', 'debt_payment', 'savings'
  description: text("description").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  metadata: jsonb("metadata"), // For extra info if needed
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount").notNull(),
  currentAmount: numeric("current_amount").default("0").notNull(),
  isDumpBin: boolean("is_dump_bin").default(false), // For "The Dump Bin" feature
  createdAt: timestamp("created_at").defaultNow(),
});

export const debts = pgTable("debts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  totalAmount: numeric("total_amount").notNull(),
  remainingAmount: numeric("remaining_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
}));

export const debtsRelations = relations(debts, ({ one }) => ({
  user: one(users, {
    fields: [debts.userId],
    references: [users.id],
  }),
}));

// === ZOD SCHEMAS ===

export const insertTransactionSchema = createInsertSchema(transactions).omit({ 
  id: true, 
  date: true 
}).extend({
  amount: z.number().min(0.01), // Frontend sends number, we convert to string/numeric for DB if needed, or handle coercion in routes
});

export const insertGoalSchema = createInsertSchema(goals).omit({ 
  id: true, 
  createdAt: true,
  currentAmount: true 
}).extend({
  targetAmount: z.number().min(1),
});

export const insertDebtSchema = createInsertSchema(debts).omit({ 
  id: true, 
  createdAt: true,
  remainingAmount: true 
}).extend({
  totalAmount: z.number().min(1),
});


// === API CONTRACT TYPES ===

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type Debt = typeof debts.$inferSelect;
export type InsertDebt = z.infer<typeof insertDebtSchema>;

export interface NetWorthResponse {
  totalAssets: number; // Cash + Savings
  totalDebt: number;
  netWorth: number;
  breakdown: {
    wallet: number; // Derived from income - expenses (excluding debt payments/savings transfers)
    savings: number; // Sum of goals currentAmount
    debt: number; // Sum of debts remainingAmount
  }
}

export interface AllocatorResponse {
  needs: number;
  living: number;
  playing: number;
  booster: number;
  totalIncome: number;
}
