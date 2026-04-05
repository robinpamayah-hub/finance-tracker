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
  DialogDescription,
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
import type { InsurancePolicy, InsuranceType } from "@/lib/types";
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

const emptyForm = {
  name: "",
  type: "health" as InsuranceType,
  category: "",
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

  // Category management
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [renameCatDialog, setRenameCatDialog] = useState<{ old: string } | null>(null);
  const [renameCatValue, setRenameCatValue] = useState("");
  const [deleteCatDialog, setDeleteCatDialog] = useState<string | null>(null);

  // Move policy dialog
  const [moveDialog, setMoveDialog] = useState<{ policy: InsurancePolicy } | null>(null);
  const [moveTarget, setMoveTarget] = useState("");

  const categories = data.insuranceCategories;

  const totalMonthlyPremium = data.insurancePolicies.reduce(
    (sum, p) => sum + normalizeToMonthly(p.premium, p.premiumFrequency),
    0
  );
  const totalAnnualPremium = totalMonthlyPremium * 12;

  const handleSubmit = () => {
    if (!form.name || !form.provider || !form.category) return;
    const policyData = {
      name: form.name,
      type: form.type,
      category: form.category,
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
      category: policy.category,
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

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    data.addInsuranceCategory(newCategoryName.trim());
    setNewCategoryName("");
    setCategoryFormOpen(false);
  };

  const renderPolicyTable = (policies: InsurancePolicy[], title: string) => (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="secondary">
            {policies.length} {policies.length === 1 ? "policy" : "policies"}
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRenameCatDialog({ old: title });
              setRenameCatValue(title);
            }}
          >
            Rename
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => setDeleteCatDialog(title)}
          >
            Remove
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {policies.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No policies in this category yet.
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
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{policy.name}</p>
                        {policy.policyNumber && (
                          <p className="text-[10px] text-muted-foreground">
                            #{policy.policyNumber}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={TYPE_COLORS[policy.type]}
                      >
                        {TYPE_LABELS[policy.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{policy.provider}</TableCell>
                    <TableCell className="text-sm">
                      <div>
                        <p>{formatCurrencyExact(policy.premium)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          /{policy.premiumFrequency}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatCurrency(policy.deductible)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatCurrency(policy.coverageAmount)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {policy.renewalDate
                        ? format(new Date(policy.renewalDate), "MMM yyyy")
                        : "---"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setMoveDialog({ policy });
                            setMoveTarget("");
                          }}
                        >
                          Move
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(policy)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() =>
                            setDeleteDialog({
                              id: policy.id,
                              name: policy.name,
                            })
                          }
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
            <p className="text-2xl font-bold text-blue-500">
              {data.insurancePolicies.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              across {categories.length} categories
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-500/10 to-rose-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Monthly Premium</p>
            <p className="text-2xl font-bold text-rose-500">
              {formatCurrency(totalMonthlyPremium)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              across all policies
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500/10 to-amber-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Annual Cost</p>
            <p className="text-2xl font-bold text-amber-500">
              {formatCurrency(totalAnnualPremium)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              estimated yearly total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setNewCategoryName("");
            setCategoryFormOpen(true);
          }}
        >
          + Add Category
        </Button>
        <Button
          onClick={() => {
            setEditPolicy(undefined);
            setForm({
              ...emptyForm,
              category: categories[0] || "",
            });
            setFormOpen(true);
          }}
        >
          + Add Policy
        </Button>
      </div>

      {/* Category sections */}
      {categories.map((cat) => {
        const policies = data.insurancePolicies.filter(
          (p) => p.category === cat
        );
        return (
          <div key={cat}>{renderPolicyTable(policies, cat)}</div>
        );
      })}

      {/* Uncategorized (for any policies with categories that don't match) */}
      {(() => {
        const uncategorized = data.insurancePolicies.filter(
          (p) => !categories.includes(p.category)
        );
        if (uncategorized.length === 0) return null;
        return renderPolicyTable(uncategorized, "Uncategorized");
      })()}

      {data.insurancePolicies.length === 0 && categories.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No insurance policies yet. Add a category, then add your first
              policy.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Category Dialog */}
      <Dialog open={categoryFormOpen} onOpenChange={setCategoryFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Insurance Category</DialogTitle>
            <DialogDescription>
              Create a new category to organize your policies (e.g.,
              &quot;Personal&quot;, &quot;Corporate&quot;, &quot;Dynatrace
              Benefits&quot;).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                placeholder="e.g., Personal Coverage"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCategoryFormOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddCategory}>Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Category Dialog */}
      <Dialog
        open={!!renameCatDialog}
        onOpenChange={(open) => !open && setRenameCatDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Name</Label>
              <Input
                value={renameCatValue}
                onChange={(e) => setRenameCatValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && renameCatDialog) {
                    data.renameInsuranceCategory(
                      renameCatDialog.old,
                      renameCatValue.trim()
                    );
                    setRenameCatDialog(null);
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameCatDialog(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (renameCatDialog && renameCatValue.trim()) {
                  data.renameInsuranceCategory(
                    renameCatDialog.old,
                    renameCatValue.trim()
                  );
                  setRenameCatDialog(null);
                }
              }}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog
        open={!!deleteCatDialog}
        onOpenChange={(open) => !open && setDeleteCatDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Category</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove &quot;{deleteCatDialog}&quot;? Any policies in this category
            will be moved to &quot;{categories[0] || "Uncategorized"}&quot;.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteCatDialog(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteCatDialog) {
                  data.deleteInsuranceCategory(deleteCatDialog);
                  setDeleteCatDialog(null);
                }
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Policy Dialog */}
      <Dialog
        open={!!moveDialog}
        onOpenChange={(open) => !open && setMoveDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Policy</DialogTitle>
            <DialogDescription>
              Move &quot;{moveDialog?.policy.name}&quot; to a different
              category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Move to</Label>
              <Select value={moveTarget} onValueChange={(v) => setMoveTarget(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((c) => c !== moveDialog?.policy.category)
                    .map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMoveDialog(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (moveDialog && moveTarget) {
                  data.moveInsurancePolicy(moveDialog.policy.id, moveTarget);
                  setMoveDialog(null);
                }
              }}
              disabled={!moveTarget}
            >
              Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Policy Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editPolicy ? "Edit Policy" : "Add Insurance Policy"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Policy Name</Label>
                <Input
                  placeholder="e.g., Medical PPO"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Input
                  placeholder="e.g., Aetna"
                  value={form.provider}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, provider: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    v && setForm((f) => ({ ...f, type: v as InsuranceType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    v && setForm((f) => ({ ...f, category: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, policyNumber: e.target.value }))
                }
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, premium: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Premium Frequency</Label>
                <Select
                  value={form.premiumFrequency}
                  onValueChange={(v) =>
                    v && setForm((f) => ({
                      ...f,
                      premiumFrequency:
                        v as InsurancePolicy["premiumFrequency"],
                    }))
                  }
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Deductible ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.deductible}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, deductible: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Coverage Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.coverageAmount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, coverageAmount: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Renewal Date</Label>
              <Input
                type="date"
                value={form.renewalDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, renewalDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Any additional details..."
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editPolicy ? "Update" : "Add"} Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Policy Confirmation */}
      <Dialog
        open={!!deleteDialog}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete &quot;{deleteDialog?.name}&quot;?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(null)}
            >
              Cancel
            </Button>
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
