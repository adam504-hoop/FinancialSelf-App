import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { goals, debts, transactions } from "@shared/schema";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if user exists first to determine if it's a new user
    const existingUser = await this.getUser(userData.id);
    
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!existingUser) {
      // Seed data for new user
      await this.seedNewUser(user.id);
    }

    return user;
  }

  private async seedNewUser(userId: string) {
    try {
      console.log(`Seeding data for new user: ${userId}`);
      
      // 1. Seed Goals (Dump Bin)
      await db.insert(goals).values([
        { userId, name: "New Keyboard", targetAmount: "1500000", currentAmount: "250000", isDumpBin: true },
        { userId, name: "Monitor Upgrade", targetAmount: "3000000", currentAmount: "0", isDumpBin: true },
        { userId, name: "Emergency Fund", targetAmount: "10000000", currentAmount: "500000", isDumpBin: true },
      ]);

      // 2. Seed Debts (Debt Destroyer)
      await db.insert(debts).values([
        { userId, name: "Credit Card", totalAmount: "3500000", remainingAmount: "2000000" },
      ]);

      // 3. Seed Transactions
      await db.insert(transactions).values([
        { userId, amount: "720000", type: "income", category: "salary", description: "Weekly Allowance" },
        { userId, amount: "50000", type: "expense", category: "playing", description: "Coffee & Snacks" },
        { userId, amount: "20000", type: "expense", category: "savings", description: "Saved on gas (Dump Bin)" },
      ]);
      
    } catch (error) {
      console.error("Error seeding new user data:", error);
    }
  }
}

export const authStorage = new AuthStorage();
