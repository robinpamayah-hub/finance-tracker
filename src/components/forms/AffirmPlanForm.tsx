"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { affirmPlanSchema, type AffirmPlanFormValues } from "@/lib/schemas";
import type { AffirmPlan } from "@/lib/types";

interface AffirmPlanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AffirmPlanFormValues) => void;
  editItem?: AffirmPlan;
}

export function AffirmPlanForm({ open, onOpenChange, onSubmit, editItem }: AffirmPlanFormProps) {
  const form = useForm<AffirmPlanFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(affirmPlanSchema) as any,
    defaultValues: editItem
      ? {
          merchant: editItem.merchant,
          originalAmount: editItem.originalAmount,
          monthlyPayment: editItem.monthlyPayment,
          totalPayments: editItem.totalPayments,
          paymentsRemaining: editItem.paymentsRemaining,
          dueDate: editItem.dueDate,
          apr: editItem.apr,
        }
      : {
          merchant: "",
          originalAmount: 0,
          monthlyPayment: 0,
          totalPayments: 12,
          paymentsRemaining: 12,
          dueDate: 1,
          apr: 0,
        },
  });

  const handleSubmit = (data: AffirmPlanFormValues) => {
    onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{editItem ? "Edit Affirm Plan" : "Add Affirm Plan"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant / Description</Label>
            <Input id="merchant" placeholder="e.g., Best Buy - Laptop" {...form.register("merchant")} />
            {form.formState.errors.merchant && (
              <p className="text-sm text-destructive">{form.formState.errors.merchant.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="originalAmount">Original Amount ($)</Label>
              <Input id="originalAmount" type="number" step="0.01" {...form.register("originalAmount")} />
              {form.formState.errors.originalAmount && (
                <p className="text-sm text-destructive">{form.formState.errors.originalAmount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyPayment">Monthly Payment ($)</Label>
              <Input id="monthlyPayment" type="number" step="0.01" {...form.register("monthlyPayment")} />
              {form.formState.errors.monthlyPayment && (
                <p className="text-sm text-destructive">{form.formState.errors.monthlyPayment.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="totalPayments">Total Payments</Label>
              <Input id="totalPayments" type="number" {...form.register("totalPayments")} />
              {form.formState.errors.totalPayments && (
                <p className="text-sm text-destructive">{form.formState.errors.totalPayments.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentsRemaining">Payments Remaining</Label>
              <Input id="paymentsRemaining" type="number" {...form.register("paymentsRemaining")} />
              {form.formState.errors.paymentsRemaining && (
                <p className="text-sm text-destructive">{form.formState.errors.paymentsRemaining.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="affirm-apr">APR (%)</Label>
              <Input id="affirm-apr" type="number" step="0.01" placeholder="0 for interest-free" {...form.register("apr")} />
              {form.formState.errors.apr && (
                <p className="text-sm text-destructive">{form.formState.errors.apr.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="affirm-dueDate">Due Date (day)</Label>
              <Input id="affirm-dueDate" type="number" min="1" max="31" {...form.register("dueDate")} />
              {form.formState.errors.dueDate && (
                <p className="text-sm text-destructive">{form.formState.errors.dueDate.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full">
            {editItem ? "Update" : "Add"} Affirm Plan
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
