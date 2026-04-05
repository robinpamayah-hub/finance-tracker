export type Frequency = "weekly" | "biweekly" | "semimonthly" | "monthly" | "annual";

export type BillCategory =
  | "housing"
  | "utilities"
  | "insurance"
  | "subscription"
  | "transportation"
  | "other";

export type BudgetCategory = "needs" | "wants" | "savings";

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
}

export interface CreditCard {
  id: string;
  name: string;
  balance: number;
  apr: number;
  creditLimit: number;
  minimumPayment: number;
  dueDate: number; // day of month 1-31
  isPaid: boolean;
}

export interface AffirmPlan {
  id: string;
  merchant: string;
  originalAmount: number;
  monthlyPayment: number;
  paymentsRemaining: number;
  totalPayments: number;
  dueDate: number; // day of month 1-31
  apr: number;
  isPaid: boolean;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  category: BillCategory;
  dueDate: number; // day of month 1-31
  isAutoPay: boolean;
  isPaid: boolean;
}

export type CalendarEntryStatus = "paid" | "upcoming" | "due-soon" | "overdue";
export type CalendarEntryType = "credit-card" | "affirm" | "bill";

export interface BillCalendarEntry {
  date: number;
  name: string;
  amount: number;
  type: CalendarEntryType;
  status: CalendarEntryStatus;
  sourceId: string;
}

export interface FinancialSummary {
  totalMonthlyIncome: number;
  totalMonthlyObligations: number;
  netCashFlow: number;
  dtiRatio: number;
  savingsRate: number;
  creditCardTotal: number;
  affirmTotal: number;
  billsTotal: number;
}

export interface PayoffResult {
  months: number;
  totalInterest: number;
}

export interface BudgetBreakdown {
  needs: number;
  wants: number;
  savings: number;
}

export const CATEGORY_TO_BUDGET: Record<BillCategory, BudgetCategory> = {
  housing: "needs",
  utilities: "needs",
  insurance: "needs",
  transportation: "needs",
  subscription: "wants",
  other: "wants",
};
