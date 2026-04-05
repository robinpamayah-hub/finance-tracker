"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AffirmPlan } from "@/lib/types";
import { formatCurrency, formatCurrencyExact } from "@/lib/utils";
import { addMonths, format } from "date-fns";

interface AffirmPlanDetailProps {
  plan: AffirmPlan;
  onTogglePaid: (id: string, isPaid: boolean) => void;
}

export function AffirmPlanDetail({ plan, onTogglePaid }: AffirmPlanDetailProps) {
  const paymentsMade = plan.totalPayments - plan.paymentsRemaining;
  const progressPct = plan.totalPayments > 0 ? (paymentsMade / plan.totalPayments) * 100 : 0;
  const remainingBalance = plan.monthlyPayment * plan.paymentsRemaining;
  const estimatedPayoffDate = addMonths(new Date(), plan.paymentsRemaining);
  const totalCost = plan.monthlyPayment * plan.totalPayments;
  const totalInterestPaid = totalCost - plan.originalAmount;

  return (
    <Card className="border-0 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="font-semibold text-sm">{plan.merchant}</h3>
          <Badge
            variant={plan.isPaid ? "secondary" : "outline"}
            className="text-[10px] rounded-full"
          >
            {plan.isPaid ? "Paid" : `Due ${plan.dueDate}th`}
          </Badge>
        </div>

        {/* Progress */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">
              {paymentsMade} of {plan.totalPayments} payments
            </span>
            <span className="font-semibold">{Math.round(progressPct)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-px bg-border">
          <div className="bg-card px-4 py-2.5">
            <p className="text-[10px] text-muted-foreground">Monthly</p>
            <p className="text-sm font-semibold">{formatCurrencyExact(plan.monthlyPayment)}</p>
          </div>
          <div className="bg-card px-4 py-2.5">
            <p className="text-[10px] text-muted-foreground">Remaining</p>
            <p className="text-sm font-semibold">{formatCurrency(remainingBalance)}</p>
          </div>
          <div className="bg-card px-4 py-2.5">
            <p className="text-[10px] text-muted-foreground">Original</p>
            <p className="text-sm font-semibold">{formatCurrency(plan.originalAmount)}</p>
          </div>
          <div className="bg-card px-4 py-2.5">
            <p className="text-[10px] text-muted-foreground">Payoff</p>
            <p className="text-sm font-semibold">{format(estimatedPayoffDate, "MMM yyyy")}</p>
          </div>
        </div>

        {/* Interest info */}
        <div className="px-4 py-2.5">
          {plan.apr === 0 ? (
            <div className="flex items-center gap-1.5 text-xs">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Interest Free (0% APR)</span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">APR {plan.apr}%</span>
              <span className="text-red-500 font-medium">
                +{formatCurrency(Math.max(0, totalInterestPaid))} interest
              </span>
            </div>
          )}
        </div>

        {/* Action */}
        <div className="p-3 pt-0">
          <Button
            variant={plan.isPaid ? "secondary" : "default"}
            size="sm"
            className={`w-full rounded-lg text-xs ${
              !plan.isPaid ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0" : ""
            }`}
            onClick={() => onTogglePaid(plan.id, !plan.isPaid)}
          >
            {plan.isPaid ? "Mark Unpaid" : "Mark as Paid"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
