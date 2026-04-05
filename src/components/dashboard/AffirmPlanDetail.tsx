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
  onMakePayment: (id: string) => void;
}

export function AffirmPlanDetail({ plan, onTogglePaid, onMakePayment }: AffirmPlanDetailProps) {
  const paymentsMade = plan.totalPayments - plan.paymentsRemaining;
  const progressPct = plan.totalPayments > 0 ? (paymentsMade / plan.totalPayments) * 100 : 0;
  const remainingBalance = plan.monthlyPayment * plan.paymentsRemaining;
  const estimatedPayoffDate = plan.endDate
    ? new Date(plan.endDate + "T00:00:00")
    : addMonths(new Date(), plan.paymentsRemaining);
  const totalCost = plan.monthlyPayment * plan.totalPayments;
  const totalInterestPaid = totalCost - plan.originalAmount;
  const isFullyPaid = plan.paymentsRemaining === 0;

  return (
    <Card className={`border-0 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
      plan.isPaid ? "ring-2 ring-emerald-500/50" : ""
    }`}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="font-semibold text-sm">{plan.merchant}</h3>
          <Badge
            variant={plan.isPaid ? "default" : "outline"}
            className={`text-[10px] rounded-full ${
              plan.isPaid
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : ""
            }`}
          >
            {plan.isPaid ? "Paid" : `Due ${plan.dueDate}th`}
          </Badge>
        </div>

        {/* Auto-pay indicator */}
        {plan.isAutoPay && (
          <div className="px-4 pb-1">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Auto-Pay</span>
          </div>
        )}

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
              className={`h-full rounded-full transition-all duration-500 ${
                isFullyPaid
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-violet-500 to-indigo-500"
              }`}
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
          {plan.startDate && (
            <div className="bg-card px-4 py-2.5">
              <p className="text-[10px] text-muted-foreground">Start</p>
              <p className="text-sm font-semibold">{format(new Date(plan.startDate + "T00:00:00"), "MMM d, yyyy")}</p>
            </div>
          )}
          {plan.endDate && (
            <div className="bg-card px-4 py-2.5">
              <p className="text-[10px] text-muted-foreground">End</p>
              <p className="text-sm font-semibold">{format(new Date(plan.endDate + "T00:00:00"), "MMM d, yyyy")}</p>
            </div>
          )}
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

        {/* Actions */}
        <div className="p-3 pt-0 flex gap-2">
          {!isFullyPaid && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-lg text-xs"
              onClick={() => onMakePayment(plan.id)}
            >
              Make Payment
            </Button>
          )}
          <Button
            variant={plan.isPaid ? "secondary" : "default"}
            size="sm"
            className={`flex-1 rounded-lg text-xs ${
              plan.isPaid
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30"
                : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0"
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
