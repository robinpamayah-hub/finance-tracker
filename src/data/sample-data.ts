import type { IncomeSource, CreditCard, AffirmPlan, Bill } from "@/lib/types";

export const sampleIncome: IncomeSource[] = [
  {
    id: "inc-1",
    name: "Primary Salary",
    amount: 5200,
    frequency: "monthly",
  },
  {
    id: "inc-2",
    name: "Freelance Work",
    amount: 800,
    frequency: "monthly",
  },
];

export const sampleCreditCards: CreditCard[] = [
  {
    id: "cc-1",
    name: "Chase Visa",
    balance: 4200,
    apr: 22.99,
    creditLimit: 8000,
    minimumPayment: 105,
    dueDate: 15,
    isPaid: false,
  },
  {
    id: "cc-2",
    name: "Citi Mastercard",
    balance: 1800,
    apr: 18.99,
    creditLimit: 5000,
    minimumPayment: 54,
    dueDate: 22,
    isPaid: false,
  },
  {
    id: "cc-3",
    name: "Target RedCard",
    balance: 650,
    apr: 26.99,
    creditLimit: 2000,
    minimumPayment: 29,
    dueDate: 8,
    isPaid: false,
  },
];

export const sampleAffirmPlans: AffirmPlan[] = [
  {
    id: "af-1",
    merchant: "Best Buy - Laptop",
    originalAmount: 999,
    monthlyPayment: 83.25,
    paymentsRemaining: 8,
    totalPayments: 12,
    dueDate: 5,
    apr: 0,
    isPaid: false,
  },
  {
    id: "af-2",
    merchant: "Wayfair - Furniture",
    originalAmount: 1500,
    monthlyPayment: 125,
    paymentsRemaining: 12,
    totalPayments: 12,
    dueDate: 18,
    apr: 15,
    isPaid: false,
  },
];

export const sampleBills: Bill[] = [
  {
    id: "bill-1",
    name: "Rent",
    amount: 1450,
    category: "housing",
    dueDate: 1,
    isAutoPay: true,
    isPaid: false,
  },
  {
    id: "bill-2",
    name: "Electric",
    amount: 120,
    category: "utilities",
    dueDate: 10,
    isAutoPay: false,
    isPaid: false,
  },
  {
    id: "bill-3",
    name: "Internet",
    amount: 75,
    category: "utilities",
    dueDate: 12,
    isAutoPay: true,
    isPaid: false,
  },
  {
    id: "bill-4",
    name: "Car Insurance",
    amount: 165,
    category: "insurance",
    dueDate: 20,
    isAutoPay: true,
    isPaid: false,
  },
  {
    id: "bill-5",
    name: "Netflix",
    amount: 15.99,
    category: "subscription",
    dueDate: 14,
    isAutoPay: true,
    isPaid: false,
  },
  {
    id: "bill-6",
    name: "Spotify",
    amount: 10.99,
    category: "subscription",
    dueDate: 14,
    isAutoPay: true,
    isPaid: false,
  },
];
