"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { FinancialSummary } from "@/lib/types";
import { formatCurrency, formatPercent, getDTIColor, getDTILabel } from "@/lib/utils";

interface SummaryCardsProps {
  summary: FinancialSummary;
}

const cards = [
  {
    key: "income",
    label: "Monthly Income",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    gradient: "from-emerald-500/10 to-emerald-500/5",
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "obligations",
    label: "Monthly Obligations",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    gradient: "from-rose-500/10 to-rose-500/5",
    iconBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  },
  {
    key: "cashflow",
    label: "Net Cash Flow",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    gradient: "from-blue-500/10 to-blue-500/5",
    iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  {
    key: "dti",
    label: "Debt-to-Income",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
      </svg>
    ),
    gradient: "from-violet-500/10 to-violet-500/5",
    iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
  {
    key: "savings",
    label: "Savings Rate",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2" /><path d="M2 9.1C1.3 10 1 11 1 12" />
      </svg>
    ),
    gradient: "from-amber-500/10 to-amber-500/5",
    iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
];

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cashFlowPositive = summary.netCashFlow >= 0;

  const values = [
    {
      display: formatCurrency(summary.totalMonthlyIncome),
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      display: formatCurrency(summary.totalMonthlyObligations),
      color: "text-rose-600 dark:text-rose-400",
    },
    {
      display: `${cashFlowPositive ? "+" : ""}${formatCurrency(summary.netCashFlow)}`,
      color: cashFlowPositive
        ? "text-blue-600 dark:text-blue-400"
        : "text-red-600 dark:text-red-400",
    },
    {
      display: formatPercent(summary.dtiRatio),
      color: getDTIColor(summary.dtiRatio),
      sub: getDTILabel(summary.dtiRatio),
    },
    {
      display: formatPercent(summary.savingsRate),
      color:
        summary.savingsRate >= 20
          ? "text-emerald-600 dark:text-emerald-400"
          : summary.savingsRate >= 10
          ? "text-amber-600 dark:text-amber-400"
          : "text-red-600 dark:text-red-400",
      sub: "Target: 20%+",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((card, i) => (
        <Card
          key={card.key}
          className={`relative overflow-hidden border-0 bg-gradient-to-br ${card.gradient} shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">
                {card.label}
              </span>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.iconBg}`}>
                {card.icon}
              </div>
            </div>
            <div className={`text-2xl font-bold tracking-tight ${values[i].color}`}>
              {values[i].display}
            </div>
            {values[i].sub && (
              <p className="mt-1 text-xs text-muted-foreground">{values[i].sub}</p>
            )}
            {card.key === "dti" && (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    summary.dtiRatio < 36
                      ? "bg-emerald-500"
                      : summary.dtiRatio <= 50
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(summary.dtiRatio, 100)}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
