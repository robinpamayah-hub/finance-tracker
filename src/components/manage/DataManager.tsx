"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { IncomeForm } from "@/components/forms/IncomeForm";
import { CreditCardForm } from "@/components/forms/CreditCardForm";
import { AffirmPlanForm } from "@/components/forms/AffirmPlanForm";
import { BillForm } from "@/components/forms/BillForm";
import type { FinanceData } from "@/lib/storage";
import type { IncomeSource, CreditCard, AffirmPlan, Bill, InsurancePolicy, InsuranceType } from "@/lib/types";
import { normalizeToMonthly } from "@/lib/calculations";
import { formatCurrencyExact } from "@/lib/utils";
import type { IncomeFormValues, CreditCardFormValues, AffirmPlanFormValues, BillFormValues } from "@/lib/schemas";

const INSURANCE_TYPE_LABELS: Record<InsuranceType, string> = {
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

interface DataManagerProps {
  data: FinanceData;
}

export function DataManager({ data }: DataManagerProps) {
  // Form states
  const [incomeFormOpen, setIncomeFormOpen] = useState(false);
  const [ccFormOpen, setCcFormOpen] = useState(false);
  const [affirmFormOpen, setAffirmFormOpen] = useState(false);
  const [billFormOpen, setBillFormOpen] = useState(false);

  // Edit items
  const [editIncome, setEditIncome] = useState<IncomeSource | undefined>();
  const [editCC, setEditCC] = useState<CreditCard | undefined>();
  const [editAffirm, setEditAffirm] = useState<AffirmPlan | undefined>();
  const [editBill, setEditBill] = useState<Bill | undefined>();

  // Insurance states
  const [insuranceFormOpen, setInsuranceFormOpen] = useState(false);
  const [editInsurance, setEditInsurance] = useState<InsurancePolicy | undefined>();
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [renameCategoryDialog, setRenameCategoryDialog] = useState<{ oldName: string } | null>(null);
  const [renameCategoryValue, setRenameCategoryValue] = useState("");
  const [deleteCategoryDialog, setDeleteCategoryDialog] = useState<string | null>(null);
  const [movePolicyDialog, setMovePolicyDialog] = useState<{ policyId: string; currentCategory: string } | null>(null);
  const [movePolicyTarget, setMovePolicyTarget] = useState("");

  // Insurance form state
  const [insuranceForm, setInsuranceForm] = useState({
    name: "",
    type: "life" as InsuranceType,
    category: "",
    provider: "",
    policyNumber: "",
    premium: 0,
    premiumFrequency: "monthly" as InsurancePolicy["premiumFrequency"],
    deductible: 0,
    coverageAmount: 0,
    renewalDate: "",
    notes: "",
  });

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{ type: string; id: string; name: string } | null>(null);

  // Import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleIncomeSubmit = (formData: IncomeFormValues) => {
    if (editIncome) {
      data.updateIncome(editIncome.id, formData);
      setEditIncome(undefined);
    } else {
      data.addIncome(formData);
    }
  };

  const handleCCSubmit = (formData: CreditCardFormValues) => {
    if (editCC) {
      data.updateCreditCard(editCC.id, formData);
      setEditCC(undefined);
    } else {
      data.addCreditCard(formData);
    }
  };

  const handleAffirmSubmit = (formData: AffirmPlanFormValues) => {
    if (editAffirm) {
      data.updateAffirmPlan(editAffirm.id, formData);
      setEditAffirm(undefined);
    } else {
      data.addAffirmPlan(formData);
    }
  };

  const handleBillSubmit = (formData: BillFormValues) => {
    if (editBill) {
      data.updateBill(editBill.id, formData);
      setEditBill(undefined);
    } else {
      data.addBill(formData);
    }
  };

  const handleDelete = () => {
    if (!deleteDialog) return;
    switch (deleteDialog.type) {
      case "income":
        data.deleteIncome(deleteDialog.id);
        break;
      case "creditCard":
        data.deleteCreditCard(deleteDialog.id);
        break;
      case "affirm":
        data.deleteAffirmPlan(deleteDialog.id);
        break;
      case "bill":
        data.deleteBill(deleteDialog.id);
        break;
      case "insurance":
        data.deleteInsurancePolicy(deleteDialog.id);
        break;
    }
    setDeleteDialog(null);
  };

  const resetInsuranceForm = () => {
    setInsuranceForm({
      name: "",
      type: "life",
      category: data.insuranceCategories[0] || "",
      provider: "",
      policyNumber: "",
      premium: 0,
      premiumFrequency: "monthly",
      deductible: 0,
      coverageAmount: 0,
      renewalDate: "",
      notes: "",
    });
  };

  const openInsuranceForm = (policy?: InsurancePolicy) => {
    if (policy) {
      setEditInsurance(policy);
      setInsuranceForm({
        name: policy.name,
        type: policy.type,
        category: policy.category,
        provider: policy.provider,
        policyNumber: policy.policyNumber,
        premium: policy.premium,
        premiumFrequency: policy.premiumFrequency,
        deductible: policy.deductible,
        coverageAmount: policy.coverageAmount,
        renewalDate: policy.renewalDate,
        notes: policy.notes,
      });
    } else {
      setEditInsurance(undefined);
      resetInsuranceForm();
    }
    setInsuranceFormOpen(true);
  };

  const handleInsuranceSubmit = () => {
    if (!insuranceForm.name || !insuranceForm.provider || !insuranceForm.category) return;
    if (editInsurance) {
      data.updateInsurancePolicy(editInsurance.id, insuranceForm);
      setEditInsurance(undefined);
    } else {
      data.addInsurancePolicy(insuranceForm);
    }
    setInsuranceFormOpen(false);
    resetInsuranceForm();
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    data.addInsuranceCategory(newCategoryName.trim());
    setNewCategoryName("");
    setAddCategoryOpen(false);
  };

  const handleRenameCategory = () => {
    if (!renameCategoryDialog || !renameCategoryValue.trim()) return;
    data.renameInsuranceCategory(renameCategoryDialog.oldName, renameCategoryValue.trim());
    setRenameCategoryDialog(null);
    setRenameCategoryValue("");
  };

  const handleDeleteCategory = () => {
    if (!deleteCategoryDialog) return;
    data.deleteInsuranceCategory(deleteCategoryDialog);
    setDeleteCategoryDialog(null);
  };

  const handleMovePolicy = () => {
    if (!movePolicyDialog || !movePolicyTarget) return;
    data.moveInsurancePolicy(movePolicyDialog.policyId, movePolicyTarget);
    setMovePolicyDialog(null);
    setMovePolicyTarget("");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      data.importData(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={data.loadSampleData}>
            Load Sample Data
          </Button>
          <Button variant="outline" size="sm" onClick={data.exportData}>
            Export Data
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            Import Data
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialog({ type: "all", id: "all", name: "all data" })}
          >
            Clear All Data
          </Button>
        </CardContent>
      </Card>

      {/* Income Sources */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Income Sources</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditIncome(undefined);
              setIncomeFormOpen(true);
            }}
          >
            + Add Income
          </Button>
        </CardHeader>
        <CardContent>
          {data.income.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No income sources yet. Add your first income source to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.income.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{formatCurrencyExact(item.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.frequency}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrencyExact(normalizeToMonthly(item.amount, item.frequency))}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditIncome(item);
                            setIncomeFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDeleteDialog({ type: "income", id: item.id, name: item.name })}
                        >
                          Del
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

      <Separator />

      {/* Credit Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Credit Cards</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditCC(undefined);
              setCcFormOpen(true);
            }}
          >
            + Add Card
          </Button>
        </CardHeader>
        <CardContent>
          {data.creditCards.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No credit cards added yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>APR</TableHead>
                  <TableHead>Min Payment</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.creditCards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell className="font-medium">{card.name}</TableCell>
                    <TableCell>{formatCurrencyExact(card.balance)}</TableCell>
                    <TableCell>{card.apr}%</TableCell>
                    <TableCell>{formatCurrencyExact(card.minimumPayment)}</TableCell>
                    <TableCell>{card.dueDate}th</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditCC(card);
                            setCcFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDeleteDialog({ type: "creditCard", id: card.id, name: card.name })}
                        >
                          Del
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

      <Separator />

      {/* Affirm Plans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Affirm / BNPL Plans</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditAffirm(undefined);
              setAffirmFormOpen(true);
            }}
          >
            + Add Plan
          </Button>
        </CardHeader>
        <CardContent>
          {data.affirmPlans.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No Affirm/BNPL plans added yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>APR</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.affirmPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.merchant}</TableCell>
                    <TableCell>{formatCurrencyExact(plan.monthlyPayment)}</TableCell>
                    <TableCell>{plan.paymentsRemaining}/{plan.totalPayments}</TableCell>
                    <TableCell>{plan.apr === 0 ? "0%" : `${plan.apr}%`}</TableCell>
                    <TableCell>{plan.dueDate}th</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditAffirm(plan);
                            setAffirmFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDeleteDialog({ type: "affirm", id: plan.id, name: plan.merchant })}
                        >
                          Del
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

      <Separator />

      {/* Bills */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Bills</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditBill(undefined);
              setBillFormOpen(true);
            }}
          >
            + Add Bill
          </Button>
        </CardHeader>
        <CardContent>
          {data.bills.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No bills added yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Auto-Pay</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.name}</TableCell>
                    <TableCell>{formatCurrencyExact(bill.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{bill.category}</Badge>
                    </TableCell>
                    <TableCell>{bill.dueDate}th</TableCell>
                    <TableCell>
                      {bill.isAutoPay ? (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditBill(bill);
                            setBillFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDeleteDialog({ type: "bill", id: bill.id, name: bill.name })}
                        >
                          Del
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

      {/* Insurance Policies */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Insurance Policies</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setAddCategoryOpen(true)}>
              + Category
            </Button>
            <Button size="sm" onClick={() => openInsuranceForm()}>
              + Add Policy
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Category management */}
          {data.insuranceCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-medium text-muted-foreground">Categories:</span>
              {data.insuranceCategories.map((cat) => (
                <div key={cat} className="flex items-center gap-1">
                  <Badge variant="secondary">{cat}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1 text-xs"
                    onClick={() => {
                      setRenameCategoryDialog({ oldName: cat });
                      setRenameCategoryValue(cat);
                    }}
                  >
                    Rename
                  </Button>
                  {data.insuranceCategories.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-xs text-destructive"
                      onClick={() => setDeleteCategoryDialog(cat)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {data.insurancePolicies.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No insurance policies added yet.
            </p>
          ) : (
            <>
              {/* Group policies by category */}
              {data.insuranceCategories.map((category) => {
                const policies = data.insurancePolicies.filter((p) => p.category === category);
                if (policies.length === 0) return null;
                return (
                  <div key={category}>
                    <h4 className="text-sm font-semibold mb-2">{category} ({policies.length})</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>Premium</TableHead>
                          <TableHead>Coverage</TableHead>
                          <TableHead className="w-[150px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {policies.map((policy) => (
                          <TableRow key={policy.id}>
                            <TableCell className="font-medium">{policy.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{INSURANCE_TYPE_LABELS[policy.type]}</Badge>
                            </TableCell>
                            <TableCell>{policy.provider}</TableCell>
                            <TableCell>
                              {formatCurrencyExact(policy.premium)}/{policy.premiumFrequency === "annual" ? "yr" : policy.premiumFrequency === "monthly" ? "mo" : policy.premiumFrequency}
                            </TableCell>
                            <TableCell>{policy.coverageAmount > 0 ? formatCurrencyExact(policy.coverageAmount) : "—"}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => openInsuranceForm(policy)}>
                                  Edit
                                </Button>
                                {data.insuranceCategories.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setMovePolicyDialog({ policyId: policy.id, currentCategory: policy.category });
                                      setMovePolicyTarget(data.insuranceCategories.find((c) => c !== policy.category) || "");
                                    }}
                                  >
                                    Move
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => setDeleteDialog({ type: "insurance", id: policy.id, name: policy.name })}
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
                );
              })}

              {/* Uncategorized policies */}
              {(() => {
                const uncategorized = data.insurancePolicies.filter(
                  (p) => !data.insuranceCategories.includes(p.category)
                );
                if (uncategorized.length === 0) return null;
                return (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Uncategorized ({uncategorized.length})</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>Premium</TableHead>
                          <TableHead>Coverage</TableHead>
                          <TableHead className="w-[150px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uncategorized.map((policy) => (
                          <TableRow key={policy.id}>
                            <TableCell className="font-medium">{policy.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{INSURANCE_TYPE_LABELS[policy.type]}</Badge>
                            </TableCell>
                            <TableCell>{policy.provider}</TableCell>
                            <TableCell>
                              {formatCurrencyExact(policy.premium)}/{policy.premiumFrequency === "annual" ? "yr" : policy.premiumFrequency === "monthly" ? "mo" : policy.premiumFrequency}
                            </TableCell>
                            <TableCell>{policy.coverageAmount > 0 ? formatCurrencyExact(policy.coverageAmount) : "—"}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => openInsuranceForm(policy)}>
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setMovePolicyDialog({ policyId: policy.id, currentCategory: policy.category });
                                    setMovePolicyTarget(data.insuranceCategories[0] || "");
                                  }}
                                >
                                  Move
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => setDeleteDialog({ type: "insurance", id: policy.id, name: policy.name })}
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
                );
              })()}
            </>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Forms */}
      <IncomeForm
        open={incomeFormOpen}
        onOpenChange={(open) => {
          setIncomeFormOpen(open);
          if (!open) setEditIncome(undefined);
        }}
        onSubmit={handleIncomeSubmit}
        editItem={editIncome}
      />
      <CreditCardForm
        open={ccFormOpen}
        onOpenChange={(open) => {
          setCcFormOpen(open);
          if (!open) setEditCC(undefined);
        }}
        onSubmit={handleCCSubmit}
        editItem={editCC}
      />
      <AffirmPlanForm
        open={affirmFormOpen}
        onOpenChange={(open) => {
          setAffirmFormOpen(open);
          if (!open) setEditAffirm(undefined);
        }}
        onSubmit={handleAffirmSubmit}
        editItem={editAffirm}
      />
      <BillForm
        open={billFormOpen}
        onOpenChange={(open) => {
          setBillFormOpen(open);
          if (!open) setEditBill(undefined);
        }}
        onSubmit={handleBillSubmit}
        editItem={editBill}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              {deleteDialog?.type === "all"
                ? "Are you sure you want to clear all data? This cannot be undone."
                : `Are you sure you want to delete "${deleteDialog?.name}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteDialog?.type === "all") {
                  data.clearAllData();
                  setDeleteDialog(null);
                } else {
                  handleDelete();
                }
              }}
            >
              {deleteDialog?.type === "all" ? "Clear All" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Insurance Policy Form Dialog */}
      <Dialog open={insuranceFormOpen} onOpenChange={(open) => {
        setInsuranceFormOpen(open);
        if (!open) { setEditInsurance(undefined); resetInsuranceForm(); }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editInsurance ? "Edit" : "Add"} Insurance Policy</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="ins-name">Policy Name</Label>
              <Input id="ins-name" value={insuranceForm.name} onChange={(e) => setInsuranceForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={insuranceForm.type} onValueChange={(v) => v && setInsuranceForm((f) => ({ ...f, type: v as InsuranceType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(INSURANCE_TYPE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={insuranceForm.category} onValueChange={(v) => v && setInsuranceForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {data.insuranceCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ins-provider">Provider</Label>
              <Input id="ins-provider" value={insuranceForm.provider} onChange={(e) => setInsuranceForm((f) => ({ ...f, provider: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ins-policy-number">Policy Number</Label>
              <Input id="ins-policy-number" value={insuranceForm.policyNumber} onChange={(e) => setInsuranceForm((f) => ({ ...f, policyNumber: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ins-premium">Premium</Label>
                <Input id="ins-premium" type="number" value={insuranceForm.premium} onChange={(e) => setInsuranceForm((f) => ({ ...f, premium: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="grid gap-2">
                <Label>Frequency</Label>
                <Select value={insuranceForm.premiumFrequency} onValueChange={(v) => v && setInsuranceForm((f) => ({ ...f, premiumFrequency: v as InsurancePolicy["premiumFrequency"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Biweekly</SelectItem>
                    <SelectItem value="semimonthly">Semi-monthly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ins-deductible">Deductible</Label>
                <Input id="ins-deductible" type="number" value={insuranceForm.deductible} onChange={(e) => setInsuranceForm((f) => ({ ...f, deductible: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ins-coverage">Coverage Amount</Label>
                <Input id="ins-coverage" type="number" value={insuranceForm.coverageAmount} onChange={(e) => setInsuranceForm((f) => ({ ...f, coverageAmount: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ins-renewal">Renewal Date</Label>
              <Input id="ins-renewal" type="date" value={insuranceForm.renewalDate} onChange={(e) => setInsuranceForm((f) => ({ ...f, renewalDate: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ins-notes">Notes</Label>
              <Input id="ins-notes" value={insuranceForm.notes} onChange={(e) => setInsuranceForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInsuranceFormOpen(false)}>Cancel</Button>
            <Button onClick={handleInsuranceSubmit}>{editInsurance ? "Update" : "Add"} Policy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Insurance Category</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="new-cat">Category Name</Label>
            <Input
              id="new-cat"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              placeholder="e.g., Dynatrace Life Coverage"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCategoryOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCategory}>Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Category Dialog */}
      <Dialog open={!!renameCategoryDialog} onOpenChange={(open) => !open && setRenameCategoryDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Category</DialogTitle>
            <DialogDescription>Rename &ldquo;{renameCategoryDialog?.oldName}&rdquo; to a new name. All policies in this category will be updated.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="rename-cat">New Name</Label>
            <Input
              id="rename-cat"
              value={renameCategoryValue}
              onChange={(e) => setRenameCategoryValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameCategory()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameCategoryDialog(null)}>Cancel</Button>
            <Button onClick={handleRenameCategory}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={!!deleteCategoryDialog} onOpenChange={(open) => !open && setDeleteCategoryDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Category</DialogTitle>
            <DialogDescription>
              Remove &ldquo;{deleteCategoryDialog}&rdquo;? Policies in this category will be moved to &ldquo;{data.insuranceCategories.find((c) => c !== deleteCategoryDialog) || "Uncategorized"}&rdquo;.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCategoryDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Policy Dialog */}
      <Dialog open={!!movePolicyDialog} onOpenChange={(open) => !open && setMovePolicyDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Policy</DialogTitle>
            <DialogDescription>Move this policy to a different category.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label>Move to</Label>
            <Select value={movePolicyTarget} onValueChange={(v) => setMovePolicyTarget(v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {data.insuranceCategories
                  .filter((c) => c !== movePolicyDialog?.currentCategory)
                  .map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovePolicyDialog(null)}>Cancel</Button>
            <Button onClick={handleMovePolicy}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
