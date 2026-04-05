"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import type { IncomeSource, CreditCard, AffirmPlan, Bill } from "@/lib/types";
import { normalizeToMonthly } from "@/lib/calculations";
import { formatCurrencyExact } from "@/lib/utils";
import type { IncomeFormValues, CreditCardFormValues, AffirmPlanFormValues, BillFormValues } from "@/lib/schemas";

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
    }
    setDeleteDialog(null);
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
    </div>
  );
}
