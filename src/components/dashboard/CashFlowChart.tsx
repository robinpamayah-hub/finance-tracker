"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FinancialSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface CashFlowChartProps {
  summary: FinancialSummary;
}

const COLORS = {
  income: "#34d399",
  creditCards: "#fb7185",
  affirm: "#a78bfa",
  bills: "#fbbf24",
  remaining: "#818cf8",
};

export function CashFlowChart({ summary }: CashFlowChartProps) {
  const items = [
    { name: "Income", value: summary.totalMonthlyIncome, color: COLORS.income },
    { name: "Credit Cards", value: -summary.creditCardTotal, color: COLORS.creditCards },
    { name: "Affirm", value: -summary.affirmTotal, color: COLORS.affirm },
    { name: "Bills", value: -summary.billsTotal, color: COLORS.bills },
    { name: "Remaining", value: summary.netCashFlow, color: COLORS.remaining },
  ];

  const waterfallData = [];
  let runningTotal = 0;

  for (const item of items) {
    if (item.name === "Income") {
      waterfallData.push({ name: item.name, base: 0, value: item.value, color: item.color, display: item.value });
      runningTotal = item.value;
    } else if (item.name === "Remaining") {
      waterfallData.push({ name: item.name, base: 0, value: Math.max(0, summary.netCashFlow), color: item.color, display: summary.netCashFlow });
    } else {
      const absValue = Math.abs(item.value);
      runningTotal -= absValue;
      waterfallData.push({ name: item.name, base: Math.max(0, runningTotal), value: absValue, color: item.color, display: item.value });
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Cash Flow Waterfall</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfallData} barCategoryGap="25%" margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                width={55}
              />
              <Tooltip
                formatter={(_value, _name, props) => {
                  const display = (props?.payload as { display?: number })?.display ?? 0;
                  return [formatCurrency(display), "Amount"];
                }}
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
                cursor={{ fill: "rgba(255,255,255,0.05)", radius: 6 }}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
              <Bar dataKey="base" stackId="waterfall" fill="transparent" />
              <Bar dataKey="value" stackId="waterfall" radius={[6, 6, 0, 0]}>
                {waterfallData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
