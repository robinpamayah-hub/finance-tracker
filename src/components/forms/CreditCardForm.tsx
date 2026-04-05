"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { creditCardSchema, type CreditCardFormValues } from "@/lib/schemas";
import type { CreditCard } from "@/lib/types";

interface CreditCardFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreditCardFormValues) => void;
  editItem?: CreditCard;
}

export function CreditCardForm({ open, onOpenChange, onSubmit, editItem }: CreditCardFormProps) {
  const form = useForm<CreditCardFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(creditCardSchema) as any,
    defaultValues: editItem
      ? {
          name: editItem.name,
          balance: editItem.balance,
          apr: editItem.apr,
          creditLimit: editItem.creditLimit,
          minimumPayment: editItem.minimumPayment,
          dueDate: editItem.dueDate,
        }
      : { name: "", balance: 0, apr: 0, creditLimit: 0, minimumPayment: 0, dueDate: 1 },
  });

  const handleSubmit = (data: CreditCardFormValues) => {
    onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{editItem ? "Edit Credit Card" : "Add Credit Card"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cc-name">Card Name</Label>
            <Input id="cc-name" placeholder="e.g., Chase Visa" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="balance">Balance ($)</Label>
              <Input id="balance" type="number" step="0.01" {...form.register("balance")} />
              {form.formState.errors.balance && (
                <p className="text-sm text-destructive">{form.formState.errors.balance.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditLimit">Credit Limit ($)</Label>
              <Input id="creditLimit" type="number" step="0.01" {...form.register("creditLimit")} />
              {form.formState.errors.creditLimit && (
                <p className="text-sm text-destructive">{form.formState.errors.creditLimit.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="apr">APR (%)</Label>
              <Input id="apr" type="number" step="0.01" {...form.register("apr")} />
              {form.formState.errors.apr && (
                <p className="text-sm text-destructive">{form.formState.errors.apr.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimumPayment">Min Payment ($)</Label>
              <Input id="minimumPayment" type="number" step="0.01" {...form.register("minimumPayment")} />
              {form.formState.errors.minimumPayment && (
                <p className="text-sm text-destructive">{form.formState.errors.minimumPayment.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cc-dueDate">Due Date (day of month)</Label>
            <Input id="cc-dueDate" type="number" min="1" max="31" {...form.register("dueDate")} />
            {form.formState.errors.dueDate && (
              <p className="text-sm text-destructive">{form.formState.errors.dueDate.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full">
            {editItem ? "Update" : "Add"} Credit Card
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
