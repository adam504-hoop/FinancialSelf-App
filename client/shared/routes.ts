import { z } from 'zod';
import { 
  insertTransactionSchema, 
  insertGoalSchema, 
  insertDebtSchema, 
  transactions, 
  goals, 
  debts 
} from './schema';

export { insertTransactionSchema, insertGoalSchema, insertDebtSchema };

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  transactions: {
    list: {
      method: 'GET' as const,
      path: '/api/transactions',
      responses: {
        200: z.array(z.custom<typeof transactions.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/transactions',
      input: insertTransactionSchema,
      responses: {
        201: z.custom<typeof transactions.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/transactions/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  goals: {
    list: {
      method: 'GET' as const,
      path: '/api/goals',
      responses: {
        200: z.array(z.custom<typeof goals.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/goals',
      input: insertGoalSchema,
      responses: {
        201: z.custom<typeof goals.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    updateAmount: {
      method: 'PATCH' as const,
      path: '/api/goals/:id/contribute',
      input: z.object({ amount: z.number() }),
      responses: {
        200: z.custom<typeof goals.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/goals/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  debts: {
    list: {
      method: 'GET' as const,
      path: '/api/debts',
      responses: {
        200: z.array(z.custom<typeof debts.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/debts',
      input: insertDebtSchema,
      responses: {
        201: z.custom<typeof debts.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    payment: {
      method: 'POST' as const,
      path: '/api/debts/:id/pay',
      input: z.object({ amount: z.number() }),
      responses: {
        200: z.custom<typeof debts.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  analytics: {
    netWorth: {
      method: 'GET' as const,
      path: '/api/analytics/net-worth',
      responses: {
        200: z.object({
          totalAssets: z.number(),
          totalDebt: z.number(),
          netWorth: z.number(),
          breakdown: z.object({
            wallet: z.number(),
            savings: z.number(),
            debt: z.number(),
          }),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    allocator: {
      method: 'POST' as const,
      path: '/api/analytics/allocator', // NLP endpoint
      input: z.object({ income: z.number() }),
      responses: {
        200: z.object({
          needs: z.number(),
          living: z.number(),
          playing: z.number(),
          booster: z.number(),
          totalIncome: z.number(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
