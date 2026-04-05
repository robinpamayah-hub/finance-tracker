"use client";

import type { CreditCard, AffirmPlan } from "@/lib/types";
import { CreditCardDetail } from "./CreditCardDetail";
import { AffirmPlanDetail } from "./AffirmPlanDetail";
import { calcTotalInterestProjection } from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";

interface DebtCardsProps {
  creditCards: CreditCard[];
  affirmPlans: AffirmPlan[];
  onUpdateCreditCard: (id: string, data: Partial<CreditCard>) => void;
  onUpdateAffirmPlan: (id: string, data: Partial<AffirmPlan>) => void;
}

export function DebtCards({
  creditCards,
  affirmPlans,
  onUpdateCreditCard,
  onUpdateAffirmPlan,
}: DebtCardsProps) {
  if (creditCards.length === 0 && affirmPlans.length === 0) return null;

  const totalCCBalance = creditCards.reduce((sum, c) => sum + c.balance, 0);
  const totalProjectedInterest = calcTotalInterestProjection(creditCards);

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Debt Overview</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Track balances & payoff progress</p>
        </div>
        {creditCards.length > 0 && (
          <div className="flex gap-4 text-xs">
            <div className="text-right">
              <p className="text-muted-foreground">Total Balance</p>
              <p className="font-semibold">{formatCurrency(totalCCBalance)}</p>
            </div>
            {totalProjectedInterest > 0 && (
              <div className="text-right">
                <p className="text-muted-foreground">Est. Interest</p>
                <p className="font-semibold text-red-500">{formatCurrency(totalProjectedInterest)}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Credit Cards */}
      {creditCards.length > 0 && (
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Credit Cards
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {creditCards.map((card) => (
              <CreditCardDetail
                key={card.id}
                card={card}
                onTogglePaid={(id, isPaid) => onUpdateCreditCard(id, { isPaid })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Affirm Plans */}
      {affirmPlans.length > 0 && (
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Affirm / BNPL Plans
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {affirmPlans.map((plan) => (
              <AffirmPlanDetail
                key={plan.id}
                plan={plan}
                onTogglePaid={(id, isPaid) => onUpdateAffirmPlan(id, { isPaid })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
