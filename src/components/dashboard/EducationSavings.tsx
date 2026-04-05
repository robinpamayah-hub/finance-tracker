"use client";

import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
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
import type { EducationAccount, AccountType, Contribution } from "@/lib/types";
import type { FinanceData } from "@/lib/storage";
import { formatCurrency, formatCurrencyExact } from "@/lib/utils";
import { format, differenceInMonths } from "date-fns";

interface EducationSavingsProps {
  data: FinanceData;
}

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  "529": "529 Plan",
  esa: "Coverdell ESA",
  utma: "UTMA/UGMA",
  other: "Other",
};

const BENEFICIARY_COLORS: Record<string, string> = {
  "0": "#818cf8",
  "1": "#34d399",
  "2": "#fb7185",
  "3": "#fbbf24",
};

const emptyForm = {
  beneficiary: "",
  accountType: "529" as AccountType,
  institution: "",
  balance: "",
  monthlyContribution: "",
  targetAmount: "",
  targetDate: "",
  notes: "",
};

function projectGrowth(balance: number, monthly: number, months: number, annualReturn: number = 0.07) {
  const monthlyReturn = annualReturn / 12;
  const points: { month: number; balance: number }[] = [{ month: 0, balance }];
  let current = balance;
  for (let i = 1; i <= months; i++) {
    current = current * (1 + monthlyReturn) + monthly;
    if (i % 6 === 0 || i === months) {
      points.push({ month: i, balance: Math.round(current) });
    }
  }
  return points;
}

export function EducationSavings({ data }: EducationSavingsProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<EducationAccount | undefined>();
  const [form, setForm] = useState(emptyForm);
  const [contribFormOpen, setContribFormOpen] = useState(false);
  const [contribAccountId, setContribAccountId] = useState<string | null>(null);
  const [contribForm, setContribForm] = useState({ date: new Date().toISOString().slice(0, 10), amount: "", note: "" });
  const [deleteDialog, setDeleteDialog] = useState<{ type: "account" | "contribution"; id: string; name: string } | null>(null);

  const totalBalance = data.educationAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalMonthlyContrib = data.educationAccounts.reduce((sum, a) => sum + a.monthlyContribution, 0);
  const totalTarget = data.educationAccounts.reduce((sum, a) => sum + a.targetAmount, 0);

  // Group by beneficiary
  const beneficiaries = useMemo(() => {
    const map: Record<string, EducationAccount[]> = {};
    for (const acc of data.educationAccounts) {
      if (!map[acc.beneficiary]) map[acc.beneficiary] = [];
      map[acc.beneficiary].push(acc);
    }
    return map;
  }, [data.educationAccounts]);

  const handleSubmit = () => {
    if (!form.beneficiary || !form.institution) return;
    const accountData = {
      beneficiary: form.beneficiary,
      accountType: form.accountType,
      institution: form.institution,
      balance: parseFloat(form.balance) || 0,
      monthlyContribution: parseFloat(form.monthlyContribution) || 0,
      targetAmount: parseFloat(form.targetAmount) || 0,
      targetDate: form.targetDate,
      notes: form.notes,
    };
    if (editAccount) {
      data.updateEducationAccount(editAccount.id, accountData);
    } else {
      data.addEducationAccount(accountData);
    }
    setForm(emptyForm);
    setEditAccount(undefined);
    setFormOpen(false);
  };

  const handleContribution = () => {
    if (!contribAccountId || !contribForm.amount) return;
    const amount = parseFloat(contribForm.amount);
    data.addContribution({
      accountId: contribAccountId,
      date: contribForm.date,
      amount,
      note: contribForm.note,
    });
    // Update account balance
    const account = data.educationAccounts.find((a) => a.id === contribAccountId);
    if (account) {
      data.updateEducationAccount(contribAccountId, { balance: account.balance + amount });
    }
    setContribForm({ date: new Date().toISOString().slice(0, 10), amount: "", note: "" });
    setContribFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Balance</p>
            <p className="text-2xl font-bold text-emerald-500">{formatCurrency(totalBalance)}</p>
            <p className="text-xs text-muted-foreground mt-1">across all accounts</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-500/10 to-violet-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Monthly Contributions</p>
            <p className="text-2xl font-bold text-violet-500">{formatCurrency(totalMonthlyContrib)}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatCurrency(totalMonthlyContrib * 12)}/year</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Target Total</p>
            <p className="text-2xl font-bold text-blue-500">{formatCurrency(totalTarget)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalTarget > 0 ? `${((totalBalance / totalTarget) * 100).toFixed(0)}% funded` : "No targets set"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500/10 to-amber-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Beneficiaries</p>
            <p className="text-2xl font-bold text-amber-500">{Object.keys(beneficiaries).length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {Object.keys(beneficiaries).join(", ") || "None yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditAccount(undefined);
            setForm(emptyForm);
            setFormOpen(true);
          }}
        >
          + Add Account
        </Button>
      </div>

      {/* Per-beneficiary sections */}
      {Object.entries(beneficiaries).map(([name, accounts], beneficiaryIndex) => {
        const beneficiaryBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
        const beneficiaryTarget = accounts.reduce((sum, a) => sum + a.targetAmount, 0);
        const beneficiaryMonthly = accounts.reduce((sum, a) => sum + a.monthlyContribution, 0);
        const color = BENEFICIARY_COLORS[String(beneficiaryIndex % 4)];

        // Projection: months until oldest target date
        const targetDates = accounts.filter((a) => a.targetDate).map((a) => new Date(a.targetDate));
        const maxTarget = targetDates.length > 0 ? Math.max(...targetDates.map((d) => d.getTime())) : null;
        const monthsToTarget = maxTarget ? Math.max(0, differenceInMonths(new Date(maxTarget), new Date())) : 216; // 18 years default
        const projectionData = projectGrowth(beneficiaryBalance, beneficiaryMonthly, Math.min(monthsToTarget, 240));

        return (
          <Card key={name} className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: color }}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-base">{name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {accounts.length} {accounts.length === 1 ? "account" : "accounts"} &middot; {formatCurrency(beneficiaryBalance)} balance
                    </p>
                  </div>
                </div>
                {beneficiaryTarget > 0 && (
                  <div className="text-right">
                    <p className="text-sm font-semibold">{((beneficiaryBalance / beneficiaryTarget) * 100).toFixed(0)}%</p>
                    <p className="text-[10px] text-muted-foreground">of {formatCurrency(beneficiaryTarget)} goal</p>
                  </div>
                )}
              </div>
              {/* Progress bar */}
              {beneficiaryTarget > 0 && (
                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min((beneficiaryBalance / beneficiaryTarget) * 100, 100)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Projection chart */}
              {beneficiaryMonthly > 0 && (
                <div className="h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                      <defs>
                        <linearGradient id={`edu-grad-${beneficiaryIndex}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="month"
                        tickFormatter={(m) => `${Math.round(m / 12)}y`}
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        width={45}
                      />
                      <Tooltip
                        formatter={(value) => [formatCurrency(Number(value)), "Projected Balance"]}
                        labelFormatter={(m) => `Year ${(Number(m) / 12).toFixed(1)}`}
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
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke={color}
                        fill={`url(#edu-grad-${beneficiaryIndex})`}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Accounts table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Monthly</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Target Date</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{account.institution}</p>
                          {account.notes && <p className="text-[10px] text-muted-foreground">{account.notes}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ACCOUNT_TYPE_LABELS[account.accountType]}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrencyExact(account.balance)}</TableCell>
                      <TableCell>{formatCurrencyExact(account.monthlyContribution)}</TableCell>
                      <TableCell>{account.targetAmount > 0 ? formatCurrency(account.targetAmount) : "---"}</TableCell>
                      <TableCell>
                        {account.targetDate ? format(new Date(account.targetDate), "MMM yyyy") : "---"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setContribAccountId(account.id);
                              setContribForm({ date: new Date().toISOString().slice(0, 10), amount: "", note: "" });
                              setContribFormOpen(true);
                            }}
                          >
                            +$
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditAccount(account);
                              setForm({
                                beneficiary: account.beneficiary,
                                accountType: account.accountType,
                                institution: account.institution,
                                balance: account.balance.toString(),
                                monthlyContribution: account.monthlyContribution.toString(),
                                targetAmount: account.targetAmount.toString(),
                                targetDate: account.targetDate,
                                notes: account.notes,
                              });
                              setFormOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setDeleteDialog({ type: "account", id: account.id, name: `${account.beneficiary} - ${account.institution}` })}
                          >
                            Del
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Recent contributions */}
              {data.contributions.filter((c) => accounts.some((a) => a.id === c.accountId)).length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Recent Contributions</p>
                  <div className="space-y-1">
                    {data.contributions
                      .filter((c) => accounts.some((a) => a.id === c.accountId))
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .slice(0, 5)
                      .map((contrib) => {
                        const account = accounts.find((a) => a.id === contrib.accountId);
                        return (
                          <div key={contrib.id} className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{format(new Date(contrib.date), "MMM d")}</span>
                              <span>{account?.institution}</span>
                              {contrib.note && <span className="text-xs text-muted-foreground">- {contrib.note}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-emerald-500">+{formatCurrencyExact(contrib.amount)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive h-6 w-6 p-0"
                                onClick={() => setDeleteDialog({ type: "contribution", id: contrib.id, name: `${formatCurrencyExact(contrib.amount)} contribution` })}
                              >
                                x
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {data.educationAccounts.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No education savings accounts yet. Add an account to start tracking college funds.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Account Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editAccount ? "Edit Account" : "Add Education Savings Account"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Beneficiary Name</Label>
                <Input
                  placeholder="e.g., Tyson"
                  value={form.beneficiary}
                  onChange={(e) => setForm((f) => ({ ...f, beneficiary: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select value={form.accountType} onValueChange={(v) => setForm((f) => ({ ...f, accountType: v as AccountType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACCOUNT_TYPE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Institution</Label>
              <Input
                placeholder="e.g., Vanguard"
                value={form.institution}
                onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Balance ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.balance}
                  onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Monthly Contribution ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.monthlyContribution}
                  onChange={(e) => setForm((f) => ({ ...f, monthlyContribution: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.targetAmount}
                  onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Target Date</Label>
                <Input
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Any additional details..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editAccount ? "Update" : "Add"} Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contribution Dialog */}
      <Dialog open={contribFormOpen} onOpenChange={setContribFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={contribForm.date}
                onChange={(e) => setContribForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={contribForm.amount}
                onChange={(e) => setContribForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input
                placeholder="e.g., Monthly auto-deposit"
                value={contribForm.note}
                onChange={(e) => setContribForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContribFormOpen(false)}>Cancel</Button>
            <Button onClick={handleContribution}>Add Contribution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete &quot;{deleteDialog?.name}&quot;?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleteDialog) return;
                if (deleteDialog.type === "account") {
                  data.deleteEducationAccount(deleteDialog.id);
                } else {
                  data.deleteContribution(deleteDialog.id);
                }
                setDeleteDialog(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
