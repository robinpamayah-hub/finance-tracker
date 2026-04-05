"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { incomeSchema, type IncomeFormValues } from "@/lib/schemas";
import type { IncomeSource } from "@/lib/types";

interface IncomeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: IncomeFormValues) => void;
  editItem?: IncomeSource;
}

export function IncomeForm({ open, onOpenChange, onSubmit, editItem }: IncomeFormProps) {
  const form = useForm<IncomeFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(incomeSchema) as any,
    defaultValues: editItem
      ? { name: editItem.name, amount: editItem.amount, frequency: editItem.frequency }
      : { name: "", amount: 0, frequency: "monthly" },
  });

  const handleSubmit = (data: IncomeFormValues) => {
    onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{editItem ? "Edit Income" : "Add Income"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="e.g., Primary Salary" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input id="amount" type="number" step="0.01" placeholder="0.00" {...form.register("amount")} />
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select
              defaultValue={form.getValues("frequency")}
              onValueChange={(value) => form.setValue("frequency", value as IncomeFormValues["frequency"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Biweekly</SelectItem>
                <SelectItem value="semimonthly">Semi-Monthly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            {editItem ? "Update" : "Add"} Income
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
