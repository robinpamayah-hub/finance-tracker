"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SoccerExpense, SoccerExpenseCategory } from "@/lib/types";
import type { FinanceData } from "@/lib/storage";
import { maskedCurrency } from "@/lib/utils";
import { useMask } from "@/lib/mask-context";
import { format } from "date-fns";

interface MasonSoccerProps {
  data: FinanceData;
}

const CATEGORY_LABELS: Record<SoccerExpenseCategory, string> = {
  registration: "Registration",
  equipment: "Equipment",
  travel: "Travel",
  tournament: "Tournament",
  training: "Training",
  uniform: "Uniform",
  other: "Other",
};

const CATEGORY_COLORS: Record<SoccerExpenseCategory, string> = {
  registration: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  equipment: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  travel: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  tournament: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  training: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  uniform: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const emptyForm = {
  description: "",
  amount: "",
  category: "registration" as SoccerExpenseCategory,
  date: new Date().toISOString().slice(0, 10),
  season: "",
  paid: false,
  notes: "",
};

export function MasonSoccer({ data }: MasonSoccerProps) {
  const isMasked = useMask();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [seasonFilter, setSeasonFilter] = useState<string>("all");

  const seasons = useMemo(() => {
    const set = new Set(data.soccerExpenses.map((e) => e.season));
    return Array.from(set).sort().reverse();
  }, [data.soccerExpenses]);

  const filtered = useMemo(() => {
    const list = seasonFilter === "all"
      ? data.soccerExpenses
      : data.soccerExpenses.filter((e) => e.season === seasonFilter);
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [data.soccerExpenses, seasonFilter]);

  const totalSpent = useMemo(
    () => filtered.reduce((sum, e) => sum + e.amount, 0),
    [filtered],
  );
  const totalUnpaid = useMemo(
    () => filtered.filter((e) => !e.paid).reduce((sum, e) => sum + e.amount, 0),
    [filtered],
  );

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (expense: SoccerExpense) => {
    setEditId(expense.id);
    setForm({
      description: expense.description,
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date,
      season: expense.season,
      paid: expense.paid,
      notes: expense.notes,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const amount = parseFloat(form.amount);
    if (!form.description || isNaN(amount) || !form.season) return;

    const payload = {
      description: form.description,
      amount,
      category: form.category,
      date: form.date,
      season: form.season,
      paid: form.paid,
      notes: form.notes,
    };

    if (editId) {
      data.updateSoccerExpense(editId, payload);
    } else {
      data.addSoccerExpense(payload);
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maskedCurrency(totalSpent, isMasked)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unpaid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{maskedCurrency(totalUnpaid, isMasked)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filtered.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mason Soccer Expenses</CardTitle>
            <div className="flex items-center gap-2">
              {seasons.length > 0 && (
                <Select value={seasonFilter} onValueChange={(v) => setSeasonFilter(v ?? "all")}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Seasons" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Seasons</SelectItem>
                    {seasons.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button onClick={openAdd}>Add Expense</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No expenses yet. Click &quot;Add Expense&quot; to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Season</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.date + "T00:00:00"), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div>{expense.description}</div>
                      {expense.notes && (
                        <div className="text-xs text-muted-foreground">{expense.notes}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={CATEGORY_COLORS[expense.category]} variant="outline">
                        {CATEGORY_LABELS[expense.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>{expense.season}</TableCell>
                    <TableCell className="text-right font-medium">
                      {maskedCurrency(expense.amount, isMasked)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={expense.paid ? "default" : "destructive"}>
                        {expense.paid ? "Paid" : "Unpaid"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(expense)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => data.updateSoccerExpense(expense.id, { paid: !expense.paid })}
                        >
                          {expense.paid ? "Mark Unpaid" : "Mark Paid"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => data.deleteSoccerExpense(expense.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Expense" : "Add Expense"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Spring registration fee"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v as SoccerExpenseCategory })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_LABELS) as SoccerExpenseCategory[]).map((cat) => (
                      <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="season">Season</Label>
                <Input
                  id="season"
                  value={form.season}
                  onChange={(e) => setForm({ ...form, season: e.target.value })}
                  placeholder="e.g. Spring 2026"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="paid"
                checked={form.paid}
                onChange={(e) => setForm({ ...form, paid: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="paid">Paid</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editId ? "Save Changes" : "Add Expense"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
