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
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  isAutoPay?: boolean;
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

// RSU Types
export interface RSUGrant {
  id: string;
  company: string;
  ticker: string;
  grantDate: string; // ISO date
  totalShares: number;
  vestingSchedule: VestingEvent[];
}

export interface VestingEvent {
  id: string;
  date: string; // ISO date
  shares: number;
  vested: boolean;
}

export interface StockQuote {
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

// Currency
export interface ExchangeRate {
  rate: number; // USD to CAD
  lastUpdated: string;
}

// Insurance Types
export const DEFAULT_INSURANCE_CATEGORIES = [
  "Employer Coverage",
  "External Coverage",
];

export type InsuranceType =
  | "health"
  | "dental"
  | "vision"
  | "life"
  | "disability"
  | "auto"
  | "home"
  | "renters"
  | "umbrella"
  | "pet"
  | "other";

export interface InsurancePolicy {
  id: string;
  name: string;
  type: InsuranceType;
  category: string; // user-defined category (e.g., "Employer Coverage", "External Coverage", etc.)
  provider: string;
  policyNumber: string;
  premium: number;
  premiumFrequency: "weekly" | "biweekly" | "semimonthly" | "monthly" | "annual";
  deductible: number;
  coverageAmount: number;
  renewalDate: string; // ISO date
  notes: string;
}

// Education Savings Types
export type AccountType = "529" | "esa" | "utma" | "other";

export interface EducationAccount {
  id: string;
  beneficiary: string;
  accountType: AccountType;
  institution: string;
  balance: number;
  monthlyContribution: number;
  targetAmount: number;
  targetDate: string; // ISO date (e.g., expected college start)
  notes: string;
}

export interface Contribution {
  id: string;
  accountId: string;
  date: string; // ISO date
  amount: number;
  note: string;
}

// Income History Types
export interface IncomeHistoryPerson {
  id: string;
  name: string;
  color: string; // hex color for charts
}

export interface IncomeHistoryEntry {
  id: string;
  personId: string;
  year: number;
  amount: number;
}

// Income Breakdown Types
export interface IncomeBreakdownItem {
  id: string;
  name: string; // e.g., "Base Salary", "Bonus", "RSU", "Commission"
  percentage: number; // 0-100
}

export interface IncomeBreakdown {
  id: string;
  personId: string;
  year: number;
  items: IncomeBreakdownItem[];
  rsuAllocationUSD: number; // RSU allocation amount in USD — syncs with RSU tab
}

// Soccer Expense Types
export type SoccerExpenseCategory =
  | "registration"
  | "equipment"
  | "travel"
  | "tournament"
  | "training"
  | "uniform"
  | "other";

export interface SoccerExpense {
  id: string;
  description: string;
  amount: number;
  category: SoccerExpenseCategory;
  date: string; // ISO date
  season: string; // e.g. "Spring 2026", "Fall 2025"
  paid: boolean;
  notes: string;
}
