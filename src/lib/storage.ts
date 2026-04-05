"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  IncomeSource,
  CreditCard,
  AffirmPlan,
  Bill,
  FinancialSummary,
  BillCalendarEntry,
  BudgetBreakdown,
  RSUGrant,
  VestingEvent,
  InsurancePolicy,
  EducationAccount,
  Contribution,
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
  rsuGrants: "finance-tracker-rsu-grants",
  insurancePolicies: "finance-tracker-insurance-policies",
  educationAccounts: "finance-tracker-education-accounts",
  contributions: "finance-tracker-contributions",
  initialized: "finance-tracker-initialized",
  lastSaved: "finance-tracker-last-saved",
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
  const [rsuGrants, setRsuGrants] = useState<RSUGrant[]>([]);
  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>([]);
  const [educationAccounts, setEducationAccounts] = useState<EducationAccount[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Auto-backup interval ref
  const autoBackupRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const initialized = localStorage.getItem(KEYS.initialized);
    if (!initialized) {
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
    setRsuGrants(load<RSUGrant[]>(KEYS.rsuGrants, []));
    setInsurancePolicies(load<InsurancePolicy[]>(KEYS.insurancePolicies, []));
    setEducationAccounts(load<EducationAccount[]>(KEYS.educationAccounts, []));
    setContributions(load<Contribution[]>(KEYS.contributions, []));
    setLastSaved(localStorage.getItem(KEYS.lastSaved));
    setIsLoaded(true);
  }, []);

  // Helper to update lastSaved timestamp
  const updateLastSaved = useCallback(() => {
    const now = new Date().toISOString();
    setLastSaved(now);
    localStorage.setItem(KEYS.lastSaved, now);
  }, []);

  // Persist on change
  useEffect(() => {
    if (!isLoaded) return;
    save(KEYS.income, income);
    updateLastSaved();
  }, [income, isLoaded, updateLastSaved]);

  useEffect(() => {
    if (!isLoaded) return;
    save(KEYS.creditCards, creditCards);
    updateLastSaved();
  }, [creditCards, isLoaded, updateLastSaved]);

  useEffect(() => {
    if (!isLoaded) return;
    save(KEYS.affirmPlans, affirmPlans);
    updateLastSaved();
  }, [affirmPlans, isLoaded, updateLastSaved]);

  useEffect(() => {
    if (!isLoaded) return;
    save(KEYS.bills, bills);
    updateLastSaved();
  }, [bills, isLoaded, updateLastSaved]);

  useEffect(() => {
    if (!isLoaded) return;
    save(KEYS.rsuGrants, rsuGrants);
    updateLastSaved();
  }, [rsuGrants, isLoaded, updateLastSaved]);

  useEffect(() => {
    if (!isLoaded) return;
    save(KEYS.insurancePolicies, insurancePolicies);
    updateLastSaved();
  }, [insurancePolicies, isLoaded, updateLastSaved]);

  useEffect(() => {
    if (!isLoaded) return;
    save(KEYS.educationAccounts, educationAccounts);
    updateLastSaved();
  }, [educationAccounts, isLoaded, updateLastSaved]);

  useEffect(() => {
    if (!isLoaded) return;
    save(KEYS.contributions, contributions);
    updateLastSaved();
  }, [contributions, isLoaded, updateLastSaved]);

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

  // RSU Grant CRUD
  const addRsuGrant = useCallback((data: Omit<RSUGrant, "id" | "vestingSchedule">) => {
    setRsuGrants((prev) => [...prev, { ...data, id: uuidv4(), vestingSchedule: [] }]);
  }, []);

  const updateRsuGrant = useCallback((id: string, data: Partial<RSUGrant>) => {
    setRsuGrants((prev) => prev.map((g) => (g.id === id ? { ...g, ...data } : g)));
  }, []);

  const deleteRsuGrant = useCallback((id: string) => {
    setRsuGrants((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const addVestingEvent = useCallback((grantId: string, data: Omit<VestingEvent, "id">) => {
    setRsuGrants((prev) =>
      prev.map((g) =>
        g.id === grantId
          ? { ...g, vestingSchedule: [...g.vestingSchedule, { ...data, id: uuidv4() }] }
          : g
      )
    );
  }, []);

  const updateVestingEvent = useCallback((grantId: string, eventId: string, data: Partial<VestingEvent>) => {
    setRsuGrants((prev) =>
      prev.map((g) =>
        g.id === grantId
          ? {
              ...g,
              vestingSchedule: g.vestingSchedule.map((e) =>
                e.id === eventId ? { ...e, ...data } : e
              ),
            }
          : g
      )
    );
  }, []);

  const deleteVestingEvent = useCallback((grantId: string, eventId: string) => {
    setRsuGrants((prev) =>
      prev.map((g) =>
        g.id === grantId
          ? { ...g, vestingSchedule: g.vestingSchedule.filter((e) => e.id !== eventId) }
          : g
      )
    );
  }, []);

  // Insurance CRUD
  const addInsurancePolicy = useCallback((data: Omit<InsurancePolicy, "id">) => {
    setInsurancePolicies((prev) => [...prev, { ...data, id: uuidv4() }]);
  }, []);

  const updateInsurancePolicy = useCallback((id: string, data: Partial<InsurancePolicy>) => {
    setInsurancePolicies((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  }, []);

  const deleteInsurancePolicy = useCallback((id: string) => {
    setInsurancePolicies((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Education Account CRUD
  const addEducationAccount = useCallback((data: Omit<EducationAccount, "id">) => {
    setEducationAccounts((prev) => [...prev, { ...data, id: uuidv4() }]);
  }, []);

  const updateEducationAccount = useCallback((id: string, data: Partial<EducationAccount>) => {
    setEducationAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
  }, []);

  const deleteEducationAccount = useCallback((id: string) => {
    setEducationAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Contribution CRUD
  const addContribution = useCallback((data: Omit<Contribution, "id">) => {
    setContributions((prev) => [...prev, { ...data, id: uuidv4() }]);
  }, []);

  const deleteContribution = useCallback((id: string) => {
    setContributions((prev) => prev.filter((c) => c.id !== id));
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
    setRsuGrants([]);
    setInsurancePolicies([]);
    setEducationAccounts([]);
    setContributions([]);
    localStorage.removeItem(KEYS.initialized);
  }, []);

  const getAllData = useCallback(() => ({
    income,
    creditCards,
    affirmPlans,
    bills,
    rsuGrants,
    insurancePolicies,
    educationAccounts,
    contributions,
  }), [income, creditCards, affirmPlans, bills, rsuGrants, insurancePolicies, educationAccounts, contributions]);

  const exportData = useCallback(() => {
    const data = getAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getAllData]);

  const importData = useCallback((json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.income) setIncome(data.income);
      if (data.creditCards) setCreditCards(data.creditCards);
      if (data.affirmPlans) setAffirmPlans(data.affirmPlans);
      if (data.bills) setBills(data.bills);
      if (data.rsuGrants) setRsuGrants(data.rsuGrants);
      if (data.insurancePolicies) setInsurancePolicies(data.insurancePolicies);
      if (data.educationAccounts) setEducationAccounts(data.educationAccounts);
      if (data.contributions) setContributions(data.contributions);
      localStorage.setItem(KEYS.initialized, "true");
      return true;
    } catch {
      return false;
    }
  }, []);

  // Auto-backup: save to localStorage backup every 5 minutes
  useEffect(() => {
    if (!isLoaded) return;
    autoBackupRef.current = setInterval(() => {
      const data = {
        income,
        creditCards,
        affirmPlans,
        bills,
        rsuGrants,
        insurancePolicies,
        educationAccounts,
        contributions,
      };
      localStorage.setItem("finance-tracker-auto-backup", JSON.stringify(data));
      localStorage.setItem("finance-tracker-auto-backup-time", new Date().toISOString());
    }, 5 * 60 * 1000);

    return () => {
      if (autoBackupRef.current) clearInterval(autoBackupRef.current);
    };
  }, [isLoaded, income, creditCards, affirmPlans, bills, rsuGrants, insurancePolicies, educationAccounts, contributions]);

  return {
    // Data
    income,
    creditCards,
    affirmPlans,
    bills,
    rsuGrants,
    insurancePolicies,
    educationAccounts,
    contributions,
    isLoaded,
    lastSaved,

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

    // RSU CRUD
    addRsuGrant,
    updateRsuGrant,
    deleteRsuGrant,
    addVestingEvent,
    updateVestingEvent,
    deleteVestingEvent,

    // Insurance CRUD
    addInsurancePolicy,
    updateInsurancePolicy,
    deleteInsurancePolicy,

    // Education CRUD
    addEducationAccount,
    updateEducationAccount,
    deleteEducationAccount,
    addContribution,
    deleteContribution,

    // Bulk
    loadSampleData,
    clearAllData,
    exportData,
    importData,
  };
}

export type FinanceData = ReturnType<typeof useFinanceData>;
