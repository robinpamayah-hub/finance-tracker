"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BudgetBreakdown } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface BudgetAnalysisProps {
  budgetBreakdown: BudgetBreakdown;
  totalIncome: number;
}

const CATEGORIES = [
  { key: "needs", label: "Needs", target: 50, color: "#f59e0b", bgColor: "bg-amber-500" },
  { key: "wants", label: "Wants", target: 30, color: "#a78bfa", bgColor: "bg-violet-400" },
  { key: "savings", label: "Savings", target: 20, color: "#10b981", bgColor: "bg-emerald-500" },
] as const;

export function BudgetAnalysis({ budgetBreakdown, totalIncome }: BudgetAnalysisProps) {
  if (totalIncome === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">50/30/20 Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            Add income to see budget analysis
          </div>
        </CardContent>
      </Card>
    );
  }

  const actuals = {
    needs: (budgetBreakdown.needs / totalIncome) * 100,
    wants: (budgetBreakdown.wants / totalIncome) * 100,
    savings: (budgetBreakdown.savings / totalIncome) * 100,
  };

  const amounts = {
    needs: budgetBreakdown.needs,
    wants: budgetBreakdown.wants,
    savings: budgetBreakdown.savings,
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">50/30/20 Budget</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stacked bar visualization */}
        <div className="space-y-3 mb-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Target</p>
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.key}
                  className="h-full first:rounded-l-full last:rounded-r-full flex items-center justify-center text-[9px] font-medium text-white"
                  style={{ width: `${cat.target}%`, backgroundColor: cat.color, opacity: 0.6 }}
                >
                  {cat.target}%
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Actual</p>
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
              {CATEGORIES.map((cat) => {
                const pct = actuals[cat.key];
                return (
                  <div
                    key={cat.key}
                    className="h-full first:rounded-l-full last:rounded-r-full flex items-center justify-center text-[9px] font-medium text-white transition-all duration-500"
                    style={{ width: `${Math.max(pct, 0)}%`, backgroundColor: cat.color }}
                  >
                    {pct >= 8 ? `${Math.round(pct)}%` : ""}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category details */}
        <div className="grid grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => {
            const actual = actuals[cat.key];
            const amount = amounts[cat.key];
            const isOver = cat.key === "savings" ? actual < cat.target : actual > cat.target;
            const isGood = cat.key === "savings" ? actual >= cat.target : actual <= cat.target;

            return (
              <div key={cat.key} className="rounded-xl bg-muted/50 p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs font-medium text-muted-foreground">{cat.label}</span>
                </div>
                <p
                  className={`text-lg font-bold ${
                    isGood
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {formatPercent(actual)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatCurrency(amount)} / {cat.target}%
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
