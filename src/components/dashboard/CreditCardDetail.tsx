"use client";

import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CreditCard } from "@/lib/types";
import { calcCreditCardPayoff } from "@/lib/calculations";
import { formatCurrency, formatCurrencyExact, formatPercent } from "@/lib/utils";

interface CreditCardDetailProps {
  card: CreditCard;
  onTogglePaid: (id: string, isPaid: boolean) => void;
}

function generatePayoffProjection(balance: number, apr: number, monthlyPayment: number) {
  const monthlyRate = apr / 100 / 12;
  let remaining = balance;
  const points = [{ month: 0, balance: remaining }];
  for (let i = 1; i <= 60 && remaining > 0; i++) {
    const interest = remaining * monthlyRate;
    remaining = Math.max(0, remaining + interest - monthlyPayment);
    if (i % 3 === 0 || remaining === 0) {
      points.push({ month: i, balance: Math.round(remaining) });
    }
  }
  return points;
}

export function CreditCardDetail({ card, onTogglePaid }: CreditCardDetailProps) {
  const utilization = card.creditLimit > 0 ? (card.balance / card.creditLimit) * 100 : 0;
  const payoff = calcCreditCardPayoff(card.balance, card.apr, card.minimumPayment);
  const projectionData = generatePayoffProjection(card.balance, card.apr, card.minimumPayment);

  const utilizationColor =
    utilization < 30 ? "bg-emerald-500" : utilization <= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <Card className={`border-0 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
      card.isPaid ? "ring-2 ring-emerald-500/50" : ""
    }`}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="font-semibold text-sm">{card.name}</h3>
          <Badge
            variant={card.isPaid ? "default" : "outline"}
            className={`text-[10px] rounded-full ${
              card.isPaid
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : ""
            }`}
          >
            {card.isPaid ? "Paid" : `Due ${card.dueDate}th`}
          </Badge>
        </div>

        {/* Balance */}
        <div className="px-4 pb-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight">{formatCurrency(card.balance)}</span>
            <span className="text-xs text-muted-foreground">/ {formatCurrency(card.creditLimit)}</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-500 ${utilizationColor}`}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground text-right">
            {formatPercent(utilization)} utilization
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-px bg-border">
          <div className="bg-card px-4 py-2.5">
            <p className="text-[10px] text-muted-foreground">APR</p>
            <p className="text-sm font-semibold">{card.apr}%</p>
          </div>
          <div className="bg-card px-4 py-2.5">
            <p className="text-[10px] text-muted-foreground">Min Payment</p>
            <p className="text-sm font-semibold">{formatCurrencyExact(card.minimumPayment)}</p>
          </div>
          <div className="bg-card px-4 py-2.5">
            <p className="text-[10px] text-muted-foreground">Payoff Time</p>
            <p className="text-sm font-semibold">
              {payoff.months >= 600 ? "Never" : `${payoff.months} mo`}
            </p>
          </div>
          <div className="bg-card px-4 py-2.5">
            <p className="text-[10px] text-muted-foreground">Total Interest</p>
            <p className="text-sm font-semibold text-red-500">
              {payoff.totalInterest < 0 ? "---" : formatCurrency(payoff.totalInterest)}
            </p>
          </div>
        </div>

        {/* Mini chart */}
        {card.balance > 0 && (
          <div className="h-[60px] px-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <defs>
                  <linearGradient id={`g-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" hide />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), "Balance"]}
                  labelFormatter={(label) => `Month ${label}`}
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "10px",
                    fontSize: "11px",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                  itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                />
                <Area type="monotone" dataKey="balance" stroke="#6366f1" fill={`url(#g-${card.id})`} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Action */}
        <div className="p-3 pt-1">
          <Button
            variant={card.isPaid ? "secondary" : "default"}
            size="sm"
            className={`w-full rounded-lg text-xs ${
              card.isPaid
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30"
                : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0"
            }`}
            onClick={() => onTogglePaid(card.id, !card.isPaid)}
          >
            {card.isPaid ? "Mark Unpaid" : "Mark as Paid"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
