"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FinancialSummary } from "@/lib/types";
import { maskedCurrency, maskedPercent } from "@/lib/utils";
import { useMask } from "@/lib/mask-context";

interface ExpenseBreakdownProps {
  summary: FinancialSummary;
}

const COLORS = ["#fb7185", "#a78bfa", "#fbbf24"];

export function ExpenseBreakdown({ summary }: ExpenseBreakdownProps) {
  const isMasked = useMask();
  const data = [
    { name: "Credit Cards", value: summary.creditCardTotal },
    { name: "Affirm/BNPL", value: summary.affirmTotal },
    { name: "Bills", value: summary.billsTotal },
  ].filter((d) => d.value > 0);

  const total = summary.totalMonthlyObligations;

  if (total === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            No expenses to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Expense Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="h-[220px] w-[220px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                >
                  {data.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [maskedCurrency(Number(value), isMasked), "Amount"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "10px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    fontSize: "13px",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                  itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                />
                <text
                  x="50%"
                  y="46%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#9ca3af"
                  fontSize={11}
                >
                  Total
                </text>
                <text
                  x="50%"
                  y="57%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground"
                  fontSize={18}
                  fontWeight={700}
                >
                  {maskedCurrency(total, isMasked)}
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {data.map((item, i) => {
              const pct = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[i] }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-semibold">{maskedCurrency(item.value, isMasked)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: COLORS[i] }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right">
                    {maskedPercent(pct, isMasked)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
