"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  IncomeSource,
  CreditCard,
  AffirmPlan,
  Bill,
  FinancialSummary,
  BillCalendarEntry,
  BudgetBreakdown,
} from "./types";
import { calcFinancialSummary, getBillCalendarEntries, calc503020 } from "./calculations";
import {
  sampleIncome,
  sampleCreditCards,
  sampleAffirmPlans,
  sampleBills,
} from "@/data/sample-data";

const KEYS = {
  income: "finance-tracker-income",
  creditCards: "finance-tracker-credit-cards",
  affirmPlans: "finance-tracker-affirm-plans",
  bills: "finance-tracker-bills",
  initialized: "finance-tracker-initialized",
} as const;

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

export function useFinanceData() {
  const [income, setIncome] = useState<IncomeSource[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [affirmPlans, setAffirmPlans] = useState<AffirmPlan[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const initialized = localStorage.getItem(KEYS.initialized);
    if (!initialized) {
      // First time - load sample data
      setIncome(sampleIncome);
      setCreditCards(sampleCreditCards);
      setAffirmPlans(sampleAffirmPlans);
      setBills(sampleBills);
      save(KEYS.income, sampleIncome);
      save(KEYS.creditCards, sampleCreditCards);
      save(KEYS.affirmPlans, sampleAffirmPlans);
      save(KEYS.bills, sampleBills);
      localStorage.setItem(KEYS.initialized, "true");
    } else {
      setIncome(load<IncomeSource[]>(KEYS.income, []));
      setCreditCards(load<CreditCard[]>(KEYS.creditCards, []));
      setAffirmPlans(load<AffirmPlan[]>(KEYS.affirmPlans, []));
      setBills(load<Bill[]>(KEYS.bills, []));
    }
    setIsLoaded(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (!isLoaded) return;
    save(KEYS.income, income);
  }, [income, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    save(KEYS.creditCards, creditCards);
  }, [creditCards, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    save(KEYS.affirmPlans, affirmPlans);
  }, [affirmPlans, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    save(KEYS.bills, bills);
  }, [bills, isLoaded]);

  // Computed values
  const summary: FinancialSummary = useMemo(
    () => calcFinancialSummary(income, creditCards, affirmPlans, bills),
    [income, creditCards, affirmPlans, bills]
  );

  const calendarEntries: BillCalendarEntry[] = useMemo(
    () => getBillCalendarEntries(creditCards, affirmPlans, bills, new Date()),
    [creditCards, affirmPlans, bills]
  );

  const budgetBreakdown: BudgetBreakdown = useMemo(
    () => calc503020(summary.totalMonthlyIncome, creditCards, affirmPlans, bills),
    [summary.totalMonthlyIncome, creditCards, affirmPlans, bills]
  );

  // Income CRUD
  const addIncome = useCallback((data: Omit<IncomeSource, "id">) => {
    setIncome((prev) => [...prev, { ...data, id: uuidv4() }]);
  }, []);

  const updateIncome = useCallback((id: string, data: Partial<IncomeSource>) => {
    setIncome((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  }, []);

  const deleteIncome = useCallback((id: string) => {
    setIncome((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Credit Card CRUD
  const addCreditCard = useCallback((data: Omit<CreditCard, "id" | "isPaid">) => {
    setCreditCards((prev) => [...prev, { ...data, id: uuidv4(), isPaid: false }]);
  }, []);

  const updateCreditCard = useCallback((id: string, data: Partial<CreditCard>) => {
    setCreditCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }, []);

  const deleteCreditCard = useCallback((id: string) => {
    setCreditCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Affirm Plan CRUD
  const addAffirmPlan = useCallback((data: Omit<AffirmPlan, "id" | "isPaid">) => {
    setAffirmPlans((prev) => [...prev, { ...data, id: uuidv4(), isPaid: false }]);
  }, []);

  const updateAffirmPlan = useCallback((id: string, data: Partial<AffirmPlan>) => {
    setAffirmPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  }, []);

  const deleteAffirmPlan = useCallback((id: string) => {
    setAffirmPlans((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Bill CRUD
  const addBill = useCallback((data: Omit<Bill, "id" | "isPaid">) => {
    setBills((prev) => [...prev, { ...data, id: uuidv4(), isPaid: false }]);
  }, []);

  const updateBill = useCallback((id: string, data: Partial<Bill>) => {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
  }, []);

  const deleteBill = useCallback((id: string) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // Bulk operations
  const loadSampleData = useCallback(() => {
    setIncome(sampleIncome);
    setCreditCards(sampleCreditCards);
    setAffirmPlans(sampleAffirmPlans);
    setBills(sampleBills);
  }, []);

  const clearAllData = useCallback(() => {
    setIncome([]);
    setCreditCards([]);
    setAffirmPlans([]);
    setBills([]);
    localStorage.removeItem(KEYS.initialized);
  }, []);

  const exportData = useCallback(() => {
    const data = { income, creditCards, affirmPlans, bills };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [income, creditCards, affirmPlans, bills]);

  const importData = useCallback((json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.income) setIncome(data.income);
      if (data.creditCards) setCreditCards(data.creditCards);
      if (data.affirmPlans) setAffirmPlans(data.affirmPlans);
      if (data.bills) setBills(data.bills);
      localStorage.setItem(KEYS.initialized, "true");
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    // Data
    income,
    creditCards,
    affirmPlans,
    bills,
    isLoaded,

    // Computed
    summary,
    calendarEntries,
    budgetBreakdown,

    // Income CRUD
    addIncome,
    updateIncome,
    deleteIncome,

    // Credit Card CRUD
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,

    // Affirm Plan CRUD
    addAffirmPlan,
    updateAffirmPlan,
    deleteAffirmPlan,

    // Bill CRUD
    addBill,
    updateBill,
    deleteBill,

    // Bulk
    loadSampleData,
    clearAllData,
    exportData,
    importData,
  };
}

export type FinanceData = ReturnType<typeof useFinanceData>;
