import type {
  IncomeSource,
  CreditCard,
  AffirmPlan,
  Bill,
  BillCalendarEntry,
  FinancialSummary,
  PayoffResult,
  BudgetBreakdown,
  Frequency,
  CalendarEntryStatus,
} from "./types";
import { CATEGORY_TO_BUDGET } from "./types";

export function normalizeToMonthly(amount: number, frequency: Frequency): number {
  switch (frequency) {
    case "weekly":
      return amount * (52 / 12);
    case "biweekly":
      return amount * (26 / 12);
    case "semimonthly":
      return amount * 2;
    case "monthly":
      return amount;
    case "annual":
      return amount / 12;
  }
}

export function calcTotalMonthlyIncome(sources: IncomeSource[]): number {
  return sources.reduce(
    (sum, s) => sum + normalizeToMonthly(s.amount, s.frequency),
    0
  );
}

export function calcCreditCardPayments(cards: CreditCard[]): number {
  return cards.reduce((sum, c) => sum + c.minimumPayment, 0);
}

export function calcAffirmPayments(plans: AffirmPlan[]): number {
  return plans.reduce((sum, p) => sum + p.monthlyPayment, 0);
}

export function calcBillsTotal(bills: Bill[]): number {
  return bills.reduce((sum, b) => sum + b.amount, 0);
}

export function calcTotalMonthlyObligations(
  cards: CreditCard[],
  plans: AffirmPlan[],
  bills: Bill[]
): number {
  return (
    calcCreditCardPayments(cards) +
    calcAffirmPayments(plans) +
    calcBillsTotal(bills)
  );
}

export function calcDTI(totalDebtPayments: number, grossMonthlyIncome: number): number {
  if (grossMonthlyIncome <= 0) return 0;
  return (totalDebtPayments / grossMonthlyIncome) * 100;
}

export function calcNetCashFlow(income: number, obligations: number): number {
  return income - obligations;
}

export function calcSavingsRate(income: number, obligations: number): number {
  if (income <= 0) return 0;
  return ((income - obligations) / income) * 100;
}

export function calcCreditCardPayoff(
  balance: number,
  apr: number,
  monthlyPayment: number
): PayoffResult {
  if (balance <= 0) return { months: 0, totalInterest: 0 };

  const monthlyRate = apr / 100 / 12;
  let remaining = balance;
  let totalInterest = 0;
  let months = 0;
  const maxMonths = 600;

  while (remaining > 0 && months < maxMonths) {
    const interest = remaining * monthlyRate;
    totalInterest += interest;
    remaining = remaining + interest - monthlyPayment;
    months++;

    if (monthlyPayment <= interest && months > 1) {
      // Payment doesn't cover interest - will never pay off
      return { months: maxMonths, totalInterest: -1 };
    }
  }

  return { months, totalInterest: Math.round(totalInterest * 100) / 100 };
}

export function calcTotalInterestProjection(cards: CreditCard[]): number {
  return cards.reduce((sum, card) => {
    const result = calcCreditCardPayoff(card.balance, card.apr, card.minimumPayment);
    return sum + (result.totalInterest > 0 ? result.totalInterest : 0);
  }, 0);
}

export function calc503020(
  income: number,
  cards: CreditCard[],
  plans: AffirmPlan[],
  bills: Bill[]
): BudgetBreakdown {
  if (income <= 0) return { needs: 0, wants: 0, savings: 0 };

  let needs = 0;
  let wants = 0;

  // All debt minimum payments are "needs"
  needs += calcCreditCardPayments(cards);
  needs += calcAffirmPayments(plans);

  // Bills classified by category
  for (const bill of bills) {
    const bucket = CATEGORY_TO_BUDGET[bill.category];
    if (bucket === "needs") {
      needs += bill.amount;
    } else {
      wants += bill.amount;
    }
  }

  const savings = Math.max(0, income - needs - wants);

  return { needs, wants, savings };
}

function getEntryStatus(
  dueDate: number,
  isPaid: boolean,
  today: number,
  currentMonth: number,
  currentYear: number,
  viewMonth: number,
  viewYear: number
): CalendarEntryStatus {
  if (isPaid) return "paid";

  const isCurrentMonth = viewMonth === currentMonth && viewYear === currentYear;

  if (!isCurrentMonth) {
    if (viewYear < currentYear || (viewYear === currentYear && viewMonth < currentMonth)) {
      return "overdue";
    }
    return "upcoming";
  }

  if (dueDate < today) return "overdue";
  if (dueDate - today <= 3) return "due-soon";
  return "upcoming";
}

export function getBillCalendarEntries(
  cards: CreditCard[],
  plans: AffirmPlan[],
  bills: Bill[],
  currentDate: Date,
  viewMonth?: number,
  viewYear?: number
): BillCalendarEntry[] {
  const today = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const vMonth = viewMonth ?? currentMonth;
  const vYear = viewYear ?? currentYear;

  const entries: BillCalendarEntry[] = [];

  for (const card of cards) {
    entries.push({
      date: card.dueDate,
      name: card.name,
      amount: card.minimumPayment,
      type: "credit-card",
      status: getEntryStatus(card.dueDate, card.isPaid, today, currentMonth, currentYear, vMonth, vYear),
      sourceId: card.id,
    });
  }

  for (const plan of plans) {
    if (plan.paymentsRemaining > 0) {
      entries.push({
        date: plan.dueDate,
        name: plan.merchant,
        amount: plan.monthlyPayment,
        type: "affirm",
        status: getEntryStatus(plan.dueDate, plan.isPaid, today, currentMonth, currentYear, vMonth, vYear),
        sourceId: plan.id,
      });
    }
  }

  for (const bill of bills) {
    entries.push({
      date: bill.dueDate,
      name: bill.name,
      amount: bill.amount,
      type: "bill",
      status: getEntryStatus(bill.dueDate, bill.isPaid, today, currentMonth, currentYear, vMonth, vYear),
      sourceId: bill.id,
    });
  }

  return entries.sort((a, b) => a.date - b.date);
}

export function calcFinancialSummary(
  income: IncomeSource[],
  cards: CreditCard[],
  plans: AffirmPlan[],
  bills: Bill[]
): FinancialSummary {
  const totalMonthlyIncome = calcTotalMonthlyIncome(income);
  const creditCardTotal = calcCreditCardPayments(cards);
  const affirmTotal = calcAffirmPayments(plans);
  const billsTotal = calcBillsTotal(bills);
  const totalMonthlyObligations = creditCardTotal + affirmTotal + billsTotal;

  // DTI only counts debt payments (credit cards + Affirm), not utility bills
  const debtPayments = creditCardTotal + affirmTotal;

  return {
    totalMonthlyIncome,
    totalMonthlyObligations,
    netCashFlow: calcNetCashFlow(totalMonthlyIncome, totalMonthlyObligations),
    dtiRatio: calcDTI(debtPayments, totalMonthlyIncome),
    savingsRate: calcSavingsRate(totalMonthlyIncome, totalMonthlyObligations),
    creditCardTotal,
    affirmTotal,
    billsTotal,
  };
}
