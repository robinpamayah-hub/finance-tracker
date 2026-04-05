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

export const rsuGrantSchema = z.object({
  company: z.string().min(1, "Company is required"),
  ticker: z.string().min(1, "Ticker is required").max(10),
  grantDate: z.string().min(1, "Grant date is required"),
  totalShares: z.coerce.number().int().positive("Must be at least 1"),
});

export const vestingEventSchema = z.object({
  date: z.string().min(1, "Date is required"),
  shares: z.coerce.number().int().positive("Must be at least 1"),
  vested: z.boolean(),
});

export const insurancePolicySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["health", "dental", "vision", "life", "disability", "auto", "home", "renters", "umbrella", "pet", "other"]),
  source: z.enum(["personal", "corporate", "employer"]),
  provider: z.string().min(1, "Provider is required"),
  policyNumber: z.string(),
  premium: z.coerce.number().min(0, "Premium cannot be negative"),
  premiumFrequency: z.enum(["weekly", "biweekly", "semimonthly", "monthly", "annual"]),
  deductible: z.coerce.number().min(0, "Deductible cannot be negative"),
  coverageAmount: z.coerce.number().min(0, "Coverage cannot be negative"),
  renewalDate: z.string(),
  notes: z.string(),
});

export const educationAccountSchema = z.object({
  beneficiary: z.string().min(1, "Beneficiary name is required"),
  accountType: z.enum(["529", "esa", "utma", "other"]),
  institution: z.string().min(1, "Institution is required"),
  balance: z.coerce.number().min(0, "Balance cannot be negative"),
  monthlyContribution: z.coerce.number().min(0, "Contribution cannot be negative"),
  targetAmount: z.coerce.number().min(0, "Target cannot be negative"),
  targetDate: z.string(),
  notes: z.string(),
});

export const contributionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  note: z.string(),
});

export type IncomeFormValues = z.output<typeof incomeSchema>;
export type CreditCardFormValues = z.output<typeof creditCardSchema>;
export type AffirmPlanFormValues = z.output<typeof affirmPlanSchema>;
export type BillFormValues = z.output<typeof billSchema>;
export type RSUGrantFormValues = z.output<typeof rsuGrantSchema>;
export type VestingEventFormValues = z.output<typeof vestingEventSchema>;
export type InsurancePolicyFormValues = z.output<typeof insurancePolicySchema>;
export type EducationAccountFormValues = z.output<typeof educationAccountSchema>;
export type ContributionFormValues = z.output<typeof contributionSchema>;
