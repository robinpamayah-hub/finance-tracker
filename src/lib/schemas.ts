import { z } from "zod";

export const incomeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  frequency: z.enum(["weekly", "biweekly", "semimonthly", "monthly", "annual"]),
});

export const creditCardSchema = z.object({
  name: z.string().min(1, "Name is required"),
  balance: z.coerce.number().min(0, "Balance cannot be negative"),
  apr: z.coerce.number().min(0).max(100, "APR must be 0-100"),
  creditLimit: z.coerce.number().positive("Credit limit must be positive"),
  minimumPayment: z.coerce.number().positive("Minimum payment must be positive"),
  dueDate: z.coerce.number().int().min(1).max(31, "Due date must be 1-31"),
});

export const affirmPlanSchema = z.object({
  merchant: z.string().min(1, "Merchant is required"),
  originalAmount: z.coerce.number().positive("Amount must be positive"),
  monthlyPayment: z.coerce.number().positive("Payment must be positive"),
  totalPayments: z.coerce.number().int().positive("Must be at least 1"),
  paymentsRemaining: z.coerce.number().int().min(0, "Cannot be negative"),
  dueDate: z.coerce.number().int().min(1).max(31, "Due date must be 1-31"),
  apr: z.coerce.number().min(0).max(100, "APR must be 0-100"),
});

export const billSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.enum([
    "housing",
    "utilities",
    "insurance",
    "subscription",
    "transportation",
    "other",
  ]),
  dueDate: z.coerce.number().int().min(1).max(31, "Due date must be 1-31"),
  isAutoPay: z.boolean(),
});

export type IncomeFormValues = z.output<typeof incomeSchema>;
export type CreditCardFormValues = z.output<typeof creditCardSchema>;
export type AffirmPlanFormValues = z.output<typeof affirmPlanSchema>;
export type BillFormValues = z.output<typeof billSchema>;
