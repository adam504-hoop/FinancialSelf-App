import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { registerAudioRoutes } from "./replit_integrations/audio/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth First
  await setupAuth(app);
  registerAuthRoutes(app);

  // Setup AI Integrations
  registerChatRoutes(app);
  registerImageRoutes(app);
  registerAudioRoutes(app);

  // === PROTECTED ROUTES ===
  // All finance routes require authentication

  // Transactions
  app.get(api.transactions.list.path, isAuthenticated, async (req: Request, res) => {
    const userId = (req.user as any).claims.sub;
    const txs = await storage.getTransactions(userId);
    res.json(txs);
  });

  app.post(api.transactions.create.path, isAuthenticated, async (req: Request, res) => {
    const userId = (req.user as any).claims.sub;
    try {
      // Coerce amount to number just in case, handled by frontend usually
      const input = api.transactions.create.input.parse(req.body);
      const tx = await storage.createTransaction({ ...input, userId });
      res.status(201).json(tx);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.transactions.delete.path, isAuthenticated, async (req: Request, res) => {
    const userId = (req.user as any).claims.sub;
    const id = Number(req.params.id);
    await storage.deleteTransaction(id, userId);
    res.status(204).send();
  });

  // Goals
  app.get(api.goals.list.path, isAuthenticated, async (req: Request, res) => {
    const userId = (req.user as any).claims.sub;
    const goals = await storage.getGoals(userId);
    res.json(goals);
  });

  app.post(api.goals.create.path, isAuthenticated, async (req: Request, res) => {
    const userId = (req.user as any).claims.sub;
    try {
      const input = api.goals.create.input.parse(req.body);
      const goal = await storage.createGoal({ ...input, userId });
      res.status(201).json(goal);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.goals.updateAmount.path, isAuthenticated, async (req: Request, res) => {
    const userId = (req.user as any).claims.sub;
    const id = Number(req.params.id);
    const { amount } = req.body;
    
    const goal = await storage.updateGoalAmount(id, userId, Number(amount));
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    
    // Create corresponding expense transaction automatically? 
    // Maybe simpler to let frontend handle that logic via separate calls if needed.
    // For "Dump Bin", saving money usually implies moving it from "Wallet" to "Savings".
    
    res.json(goal);
  });

  app.delete(api.goals.delete.path, isAuthenticated, async (req: Request, res) => {
    const userId = (req.user as any).claims.sub;
    const id = Number(req.params.id);
    await storage.deleteGoal(id, userId);
    res.status(204).send();
  });

  // Debts
  app.get(api.debts.list.path, isAuthenticated, async (req: Request, res) => {
    const userId = (req.user as any).claims.sub;
    const debts = await storage.getDebts(userId);
    res.json(debts);
  });

  app.post(api.debts.create.path, isAuthenticated, async (req: Request, res) => {
    const userId = (req.user as any).claims.sub;
    try {
      const input = api.debts.create.input.parse(req.body);
      const debt = await storage.createDebt({ ...input, userId });
      res.status(201).json(debt);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.post(api.debts.payment.path, isAuthenticated, async (req: Request, res) => {
    const userId = (req.user as any).claims.sub;
    const id = Number(req.params.id);
    const { amount } = req.body;

    const debt = await storage.payDebt(id, userId, Number(amount));
    if (!debt) return res.status(404).json({ message: "Debt not found" });
    
    res.json(debt);
  });

  // Analytics
  app.get(api.analytics.netWorth.path, isAuthenticated, async (req: Request, res) => {
    const userId = (req.user as any).claims.sub;
    const data = await storage.getNetWorth(userId);
    res.json(data);
  });

  app.post(api.analytics.allocator.path, isAuthenticated, async (req: Request, res) => {
    // Simple logic for now, could use OpenAI if "NLP" implied complex text parsing
    // But for "Input: Weekly Income 720k", it's just math.
    // We can use OpenAI to "parse" plain text like "I made 720k this week" if we wanted.
    // For MVP, let's implement the core math logic.
    
    const { income } = req.body;
    const amount = Number(income);

    const needs = amount * 0.58;
    const living = amount * 0.13;
    const playing = amount * 0.17;
    // Remainder to Booster
    const booster = amount - (needs + living + playing);

    res.json({
      needs,
      living,
      playing,
      booster,
      totalIncome: amount
    });
  });

  return httpServer;
}
