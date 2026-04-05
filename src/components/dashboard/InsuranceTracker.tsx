"use client";

import { useState } from "react";
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
import type { InsurancePolicy, InsuranceType, InsuranceSource } from "@/lib/types";
import type { FinanceData } from "@/lib/storage";
import { normalizeToMonthly } from "@/lib/calculations";
import { formatCurrency, formatCurrencyExact } from "@/lib/utils";
import { format } from "date-fns";

interface InsuranceTrackerProps {
  data: FinanceData;
}

const TYPE_LABELS: Record<InsuranceType, string> = {
  health: "Health",
  dental: "Dental",
  vision: "Vision",
  life: "Life",
  disability: "Disability",
  auto: "Auto",
  home: "Home",
  renters: "Renters",
  umbrella: "Umbrella",
  pet: "Pet",
  other: "Other",
};

const TYPE_COLORS: Record<InsuranceType, string> = {
  health: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  dental: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  vision: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  life: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  disability: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  auto: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  home: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  renters: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
  umbrella: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  pet: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
};

const SOURCE_LABELS: Record<InsuranceSource, string> = {
  personal: "Personal",
  corporate: "Robin's Corp",
  employer: "Dynatrace Life Coverage",
};

const emptyForm = {
  name: "",
  type: "health" as InsuranceType,
  source: "personal" as InsuranceSource,
  provider: "",
  policyNumber: "",
  premium: "",
  premiumFrequency: "monthly" as InsurancePolicy["premiumFrequency"],
  deductible: "",
  coverageAmount: "",
  renewalDate: "",
  notes: "",
};

export function InsuranceTracker({ data }: InsuranceTrackerProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<InsurancePolicy | undefined>();
  const [form, setForm] = useState(emptyForm);
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; name: string } | null>(null);

  const personalPolicies = data.insurancePolicies.filter((p) => p.source === "personal");
  const corporatePolicies = data.insurancePolicies.filter((p) => p.source === "corporate");
  const employerPolicies = data.insurancePolicies.filter((p) => p.source === "employer");

  const totalMonthlyPremium = data.insurancePolicies.reduce(
    (sum, p) => sum + normalizeToMonthly(p.premium, p.premiumFrequency),
    0
  );
  const totalAnnualPremium = totalMonthlyPremium * 12;

  const handleSubmit = () => {
    if (!form.name || !form.provider) return;
    const policyData = {
      name: form.name,
      type: form.type,
      source: form.source,
      provider: form.provider,
      policyNumber: form.policyNumber,
      premium: parseFloat(form.premium) || 0,
      premiumFrequency: form.premiumFrequency,
      deductible: parseFloat(form.deductible) || 0,
      coverageAmount: parseFloat(form.coverageAmount) || 0,
      renewalDate: form.renewalDate,
      notes: form.notes,
    };
    if (editPolicy) {
      data.updateInsurancePolicy(editPolicy.id, policyData);
    } else {
      data.addInsurancePolicy(policyData);
    }
    setForm(emptyForm);
    setEditPolicy(undefined);
    setFormOpen(false);
  };

  const openEdit = (policy: InsurancePolicy) => {
    setEditPolicy(policy);
    setForm({
      name: policy.name,
      type: policy.type,
      source: policy.source,
      provider: policy.provider,
      policyNumber: policy.policyNumber,
      premium: policy.premium.toString(),
      premiumFrequency: policy.premiumFrequency,
      deductible: policy.deductible.toString(),
      coverageAmount: policy.coverageAmount.toString(),
      renewalDate: policy.renewalDate,
      notes: policy.notes,
    });
    setFormOpen(true);
  };

  const renderPolicyTable = (policies: InsurancePolicy[], title: string) => (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Badge variant="secondary">{policies.length} {policies.length === 1 ? "policy" : "policies"}</Badge>
      </CardHeader>
      <CardContent>
        {policies.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No {title.toLowerCase()} added yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Deductible</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Renewal</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{policy.name}</p>
                        {policy.policyNumber && (
                          <p className="text-[10px] text-muted-foreground">#{policy.policyNumber}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={TYPE_COLORS[policy.type]}>
                        {TYPE_LABELS[policy.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{policy.provider}</TableCell>
                    <TableCell className="text-sm">
                      <div>
                        <p>{formatCurrencyExact(policy.premium)}</p>
                        <p className="text-[10px] text-muted-foreground">/{policy.premiumFrequency}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{formatCurrency(policy.deductible)}</TableCell>
                    <TableCell className="text-sm">{formatCurrency(policy.coverageAmount)}</TableCell>
                    <TableCell className="text-sm">
                      {policy.renewalDate ? format(new Date(policy.renewalDate), "MMM yyyy") : "---"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(policy)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDeleteDialog({ id: policy.id, name: policy.name })}
                        >
                          Del
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Policies</p>
            <p className="text-2xl font-bold text-blue-500">{data.insurancePolicies.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {personalPolicies.length} personal, {corporatePolicies.length} corp, {employerPolicies.length} employer
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-500/10 to-rose-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Monthly Premium</p>
            <p className="text-2xl font-bold text-rose-500">{formatCurrency(totalMonthlyPremium)}</p>
            <p className="text-xs text-muted-foreground mt-1">across all policies</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500/10 to-amber-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Annual Cost</p>
            <p className="text-2xl font-bold text-amber-500">{formatCurrency(totalAnnualPremium)}</p>
            <p className="text-xs text-muted-foreground mt-1">estimated yearly total</p>
          </CardContent>
        </Card>
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditPolicy(undefined);
            setForm(emptyForm);
            setFormOpen(true);
          }}
        >
          + Add Policy
        </Button>
      </div>

      {/* Personal Coverage */}
      {renderPolicyTable(personalPolicies, "Personal Coverage")}

      {/* Robin's Corp Coverage */}
      {renderPolicyTable(corporatePolicies, "Robin's Corp")}

      {/* Dynatrace Life Coverage */}
      {renderPolicyTable(employerPolicies, "Dynatrace Life Coverage")}

      {/* Add/Edit Policy Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPolicy ? "Edit Policy" : "Add Insurance Policy"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Policy Name</Label>
                <Input
                  placeholder="e.g., Medical PPO"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Input
                  placeholder="e.g., Aetna"
                  value={form.provider}
                  onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as InsuranceType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm((f) => ({ ...f, source: v as InsuranceSource }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Policy Number (optional)</Label>
              <Input
                placeholder="e.g., POL-123456"
                value={form.policyNumber}
                onChange={(e) => setForm((f) => ({ ...f, policyNumber: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Premium ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.premium}
                  onChange={(e) => setForm((f) => ({ ...f, premium: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Premium Frequency</Label>
                <Select value={form.premiumFrequency} onValueChange={(v) => setForm((f) => ({ ...f, premiumFrequency: v as InsurancePolicy["premiumFrequency"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Biweekly</SelectItem>
                    <SelectItem value="semimonthly">Semi-Monthly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Deductible ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.deductible}
                  onChange={(e) => setForm((f) => ({ ...f, deductible: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Coverage Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.coverageAmount}
                  onChange={(e) => setForm((f) => ({ ...f, coverageAmount: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Renewal Date</Label>
              <Input
                type="date"
                value={form.renewalDate}
                onChange={(e) => setForm((f) => ({ ...f, renewalDate: e.target.value }))}
              />
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
            <Button onClick={handleSubmit}>{editPolicy ? "Update" : "Add"} Policy</Button>
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
                if (deleteDialog) data.deleteInsurancePolicy(deleteDialog.id);
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
