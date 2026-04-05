"use client";

import type { FinancialSummary, BillCalendarEntry } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface FinancialAlertsProps {
  summary: FinancialSummary;
  calendarEntries: BillCalendarEntry[];
}

export function FinancialAlerts({ summary, calendarEntries }: FinancialAlertsProps) {
  const alerts: { title: string; description: string; type: "error" | "warning" }[] = [];

  if (summary.dtiRatio > 50) {
    alerts.push({
      title: "High Debt-to-Income Ratio",
      description: `Your DTI is ${summary.dtiRatio.toFixed(1)}%. Consider reducing debt obligations to below 36%.`,
      type: "error",
    });
  }

  if (summary.netCashFlow < 0) {
    alerts.push({
      title: "Negative Cash Flow",
      description: `Your monthly obligations exceed income by ${formatCurrency(Math.abs(summary.netCashFlow))}.`,
      type: "error",
    });
  }

  const overdueCount = calendarEntries.filter((e) => e.status === "overdue").length;
  if (overdueCount > 0) {
    const overdueTotal = calendarEntries
      .filter((e) => e.status === "overdue")
      .reduce((sum, e) => sum + e.amount, 0);
    alerts.push({
      title: "Overdue Payments",
      description: `You have ${overdueCount} overdue payment${overdueCount > 1 ? "s" : ""} totaling ${formatCurrency(overdueTotal)}.`,
      type: "error",
    });
  }

  const dueSoonCount = calendarEntries.filter((e) => e.status === "due-soon").length;
  if (dueSoonCount > 0) {
    alerts.push({
      title: "Payments Due Soon",
      description: `${dueSoonCount} payment${dueSoonCount > 1 ? "s" : ""} due within the next 3 days.`,
      type: "warning",
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${
            alert.type === "error"
              ? "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300"
              : "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 mt-0.5 flex-shrink-0"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <p className="font-medium">{alert.title}</p>
            <p className="opacity-80">{alert.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
