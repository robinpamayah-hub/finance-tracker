"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { billSchema, type BillFormValues } from "@/lib/schemas";
import type { Bill } from "@/lib/types";

interface BillFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BillFormValues) => void;
  editItem?: Bill;
}

const CATEGORIES = [
  { value: "housing", label: "Housing" },
  { value: "utilities", label: "Utilities" },
  { value: "insurance", label: "Insurance" },
  { value: "subscription", label: "Subscription" },
  { value: "transportation", label: "Transportation" },
  { value: "other", label: "Other" },
];

export function BillForm({ open, onOpenChange, onSubmit, editItem }: BillFormProps) {
  const form = useForm<BillFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(billSchema) as any,
    defaultValues: editItem
      ? {
          name: editItem.name,
          amount: editItem.amount,
          category: editItem.category,
          dueDate: editItem.dueDate,
          isAutoPay: editItem.isAutoPay,
        }
      : { name: "", amount: 0, category: "other", dueDate: 1, isAutoPay: false },
  });

  const handleSubmit = (data: BillFormValues) => {
    onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{editItem ? "Edit Bill" : "Add Bill"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bill-name">Name</Label>
            <Input id="bill-name" placeholder="e.g., Electric Bill" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bill-amount">Amount ($)</Label>
              <Input id="bill-amount" type="number" step="0.01" {...form.register("amount")} />
              {form.formState.errors.amount && (
                <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bill-dueDate">Due Date (day)</Label>
              <Input id="bill-dueDate" type="number" min="1" max="31" {...form.register("dueDate")} />
              {form.formState.errors.dueDate && (
                <p className="text-sm text-destructive">{form.formState.errors.dueDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              defaultValue={form.getValues("category")}
              onValueChange={(value) => form.setValue("category", value as BillFormValues["category"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="bill-autopay" className="cursor-pointer">
              Auto-Pay Enabled
            </Label>
            <Switch
              id="bill-autopay"
              checked={form.watch("isAutoPay")}
              onCheckedChange={(checked) => form.setValue("isAutoPay", checked)}
            />
          </div>

          <Button type="submit" className="w-full">
            {editItem ? "Update" : "Add"} Bill
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
