import { db } from "./db";
import { 
  transactions, goals, debts, users,
  type InsertTransaction, type InsertGoal, type InsertDebt,
  type Transaction, type Goal, type Debt, type NetWorthResponse
} from "@shared/schema";
import { eq, desc, sql, sum } from "drizzle-orm";

export interface IStorage {
  // Transactions
  createTransaction(tx: InsertTransaction & { userId: string }): Promise<Transaction>;
  getTransactions(userId: string): Promise<Transaction[]>;
  deleteTransaction(id: number, userId: string): Promise<void>;

  // Goals (Dump Bin)
  createGoal(goal: InsertGoal & { userId: string }): Promise<Goal>;
  getGoals(userId: string): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  updateGoalAmount(id: number, userId: string, amount: number): Promise<Goal>;
  deleteGoal(id: number, userId: string): Promise<void>;

  // Debts
  createDebt(debt: InsertDebt & { userId: string }): Promise<Debt>;
  getDebts(userId: string): Promise<Debt[]>;
  getDebt(id: number): Promise<Debt | undefined>;
  payDebt(id: number, userId: string, amount: number): Promise<Debt>;

  // Analytics
  getNetWorth(userId: string): Promise<NetWorthResponse>;
}

export class DatabaseStorage implements IStorage {
  // Transactions
  async createTransaction(tx: InsertTransaction & { userId: string }): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values({
      userId: tx.userId,
      amount: tx.amount.toString(),
      type: tx.type,
      category: tx.category,
      description: tx.description,
      metadata: tx.metadata || null,
    }).returning();
    return transaction;
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    return await db.select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date));
  }

  async deleteTransaction(id: number, userId: string): Promise<void> {
    await db.delete(transactions)
      .where(
        sql`${transactions.id} = ${id} AND ${transactions.userId} = ${userId}`
      );
  }

  // Goals
  async createGoal(goal: InsertGoal & { userId: string }): Promise<Goal> {
    const [newGoal] = await db.insert(goals).values({
      userId: goal.userId,
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      isDumpBin: goal.isDumpBin,
      currentAmount: "0",
    }).returning();
    return newGoal;
  }

  async getGoals(userId: string): Promise<Goal[]> {
    return await db.select().from(goals).where(eq(goals.userId, userId));
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal;
  }

  async updateGoalAmount(id: number, userId: string, amount: number): Promise<Goal> {
    // Increment amount
    const [goal] = await db.update(goals)
      .set({ 
        currentAmount: sql`${goals.currentAmount} + ${amount}` 
      })
      .where(
        sql`${goals.id} = ${id} AND ${goals.userId} = ${userId}`
      )
      .returning();
    return goal;
  }

  async deleteGoal(id: number, userId: string): Promise<void> {
    await db.delete(goals)
      .where(
        sql`${goals.id} = ${id} AND ${goals.userId} = ${userId}`
      );
  }

  // Debts
  async createDebt(debt: InsertDebt & { userId: string }): Promise<Debt> {
    const [newDebt] = await db.insert(debts).values({
      userId: debt.userId,
      name: debt.name,
      totalAmount: debt.totalAmount.toString(),
      remainingAmount: debt.totalAmount.toString(), // Start with full amount
    }).returning();
    return newDebt;
  }

  async getDebts(userId: string): Promise<Debt[]> {
    return await db.select().from(debts).where(eq(debts.userId, userId));
  }

  async getDebt(id: number): Promise<Debt | undefined> {
    const [debt] = await db.select().from(debts).where(eq(debts.id, id));
    return debt;
  }

  async payDebt(id: number, userId: string, amount: number): Promise<Debt> {
    // Decrease remaining amount
    const [debt] = await db.update(debts)
      .set({ 
        remainingAmount: sql`${debts.remainingAmount} - ${amount}` 
      })
      .where(
        sql`${debts.id} = ${id} AND ${debts.userId} = ${userId}`
      )
      .returning();
    return debt;
  }

  // Analytics
  async getNetWorth(userId: string): Promise<NetWorthResponse> {
    // 1. Calculate Wallet (Income - Expenses)
    // Note: Ideally 'expenses' here should exclude debt payments or savings transfers if we want "Wallet Cash",
    // but for simplicity, let's treat Wallet as pure cash flow.
    // If expense category is 'debt_payment' or 'savings', it's a transfer, but for net worth (assets - liabilities),
    // Cash is Asset. Savings is Asset. Debt is Liability.
    
    // Transactions
    const txs = await this.getTransactions(userId);
    let wallet = 0;
    txs.forEach(t => {
      const amt = Number(t.amount);
      if (t.type === 'income') wallet += amt;
      else wallet -= amt;
    });

    // 2. Savings (Goals current amounts)
    const userGoals = await this.getGoals(userId);
    const savings = userGoals.reduce((sum, g) => sum + Number(g.currentAmount), 0);

    // 3. Debt (Remaining amounts)
    const userDebts = await this.getDebts(userId);
    const debt = userDebts.reduce((sum, d) => sum + Number(d.remainingAmount), 0);

    // Total Assets = Wallet + Savings
    const totalAssets = wallet + savings;
    const netWorth = totalAssets - debt;

    return {
      totalAssets,
      totalDebt: debt,
      netWorth,
      breakdown: {
        wallet,
        savings,
        debt
      }
    };
  }
}

export const storage = new DatabaseStorage();
