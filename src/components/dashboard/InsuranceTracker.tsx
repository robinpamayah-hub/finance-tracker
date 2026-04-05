"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
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
import { formatCurrency, formatCurrencyExact, maskedCurrency, maskedCurrencyExact } from "@/lib/utils";
import { useMask } from "@/lib/mask-context";
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

// Draggable policy row component
function DraggablePolicyRow({
  policy,
  onEdit,
  onDelete,
  onMove,
  showMove,
}: {
  policy: InsurancePolicy;
  onEdit: () => void;
  onDelete: () => void;
  onMove: () => void;
  showMove: boolean;
}) {
  const isMasked = useMask();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: policy.id, data: { type: "policy", policy } });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell
        className="font-medium cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground select-none">&#x2630;</span>
          <div>
            <p>{policy.name}</p>
            {policy.policyNumber && (
              <p className="text-[10px] text-muted-foreground">
                #{policy.policyNumber}
              </p>
            )}
          </div>
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
          <p>{maskedCurrencyExact(policy.premium, isMasked)}</p>
          <p className="text-[10px] text-muted-foreground">
            /{policy.premiumFrequency}
          </p>
        </div>
      </TableCell>
      <TableCell className="text-sm">
        {maskedCurrency(policy.deductible, isMasked)}
      </TableCell>
      <TableCell className="text-sm">
        {maskedCurrency(policy.coverageAmount, isMasked)}
      </TableCell>
      <TableCell className="text-sm">
        {policy.renewalDate
          ? format(new Date(policy.renewalDate), "MMM yyyy")
          : "---"}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          {showMove && (
            <Button variant="ghost" size="sm" onClick={onMove}>
              Move
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={onDelete}
          >
            Del
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// Droppable category section
function DroppableCategory({
  category,
  policies,
  isOver,
  onRename,
  onRemove,
  onEditPolicy,
  onDeletePolicy,
  onMovePolicy,
  showCategoryActions,
  showMove,
}: {
  category: string;
  policies: InsurancePolicy[];
  isOver: boolean;
  onRename: () => void;
  onRemove: () => void;
  onEditPolicy: (p: InsurancePolicy) => void;
  onDeletePolicy: (p: InsurancePolicy) => void;
  onMovePolicy: (p: InsurancePolicy) => void;
  showCategoryActions: boolean;
  showMove: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: `category-${category}`, data: { type: "category", category } });

  return (
    <Card
      ref={setNodeRef}
      className={`border-0 shadow-sm transition-all duration-200 ${
        isOver ? "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20" : ""
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{category}</CardTitle>
          <Badge variant="secondary">
            {policies.length} {policies.length === 1 ? "policy" : "policies"}
          </Badge>
          {isOver && (
            <Badge className="bg-blue-500 text-white animate-pulse">
              Drop here
            </Badge>
          )}
        </div>
        {showCategoryActions && (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onRename}>
              Rename
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={onRemove}
            >
              Remove
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {policies.length === 0 && !isOver ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No policies in this category yet. Drag a policy here or click + Add Policy.
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
                  <DraggablePolicyRow
                    key={policy.id}
                    policy={policy}
                    onEdit={() => onEditPolicy(policy)}
                    onDelete={() => onDeletePolicy(policy)}
                    onMove={() => onMovePolicy(policy)}
                    showMove={showMove}
                  />
                ))}
                {policies.length === 0 && isOver && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-blue-500 py-4">
                      Release to drop policy here
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function InsuranceTracker({ data }: InsuranceTrackerProps) {
  const isMasked = useMask();
  const [formOpen, setFormOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<InsurancePolicy | undefined>();
  const [form, setForm] = useState(emptyForm);
  const [deleteDialog, setDeleteDialog] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Category management
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [renameCatDialog, setRenameCatDialog] = useState<{
    old: string;
  } | null>(null);
  const [renameCatValue, setRenameCatValue] = useState("");
  const [deleteCatDialog, setDeleteCatDialog] = useState<string | null>(null);

  // Move policy dialog (fallback for non-drag)
  const [moveDialog, setMoveDialog] = useState<{
    policy: InsurancePolicy;
  } | null>(null);
  const [moveTarget, setMoveTarget] = useState("");

  // Drag and drop
  const [activePolicy, setActivePolicy] = useState<InsurancePolicy | null>(null);
  const [overCategory, setOverCategory] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

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

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const policy = event.active.data.current?.policy as InsurancePolicy | undefined;
    if (policy) setActivePolicy(policy);
  };

  const handleDragOver = (event: DragEndEvent) => {
    const over = event.over;
    if (over?.data.current?.type === "category") {
      setOverCategory(over.data.current.category as string);
    } else if (over?.data.current?.type === "policy") {
      // Hovering over a policy row — find its category
      const targetPolicy = over.data.current.policy as InsurancePolicy;
      setOverCategory(targetPolicy.category);
    } else {
      setOverCategory(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePolicy(null);
    setOverCategory(null);

    if (!over || !active.data.current?.policy) return;

    const draggedPolicy = active.data.current.policy as InsurancePolicy;
    let targetCategory: string | null = null;

    if (over.data.current?.type === "category") {
      targetCategory = over.data.current.category as string;
    } else if (over.data.current?.type === "policy") {
      const targetPolicy = over.data.current.policy as InsurancePolicy;
      targetCategory = targetPolicy.category;
    }

    if (targetCategory && targetCategory !== draggedPolicy.category) {
      data.moveInsurancePolicy(draggedPolicy.id, targetCategory);
    }
  };

  const handleDragCancel = () => {
    setActivePolicy(null);
    setOverCategory(null);
  };

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
              {maskedCurrency(totalMonthlyPremium, isMasked)}
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
              {maskedCurrency(totalAnnualPremium, isMasked)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              estimated yearly total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hint */}
      <p className="text-xs text-muted-foreground text-center">
        Drag policies by the &#x2630; handle to move them between categories, or use the Move button.
      </p>

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
            setForm({ ...emptyForm, category: categories[0] || "" });
            setFormOpen(true);
          }}
        >
          + Add Policy
        </Button>
      </div>

      {/* Drag-and-drop category sections */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {categories.map((cat) => {
          const policies = data.insurancePolicies.filter(
            (p) => p.category === cat
          );
          return (
            <DroppableCategory
              key={cat}
              category={cat}
              policies={policies}
              isOver={overCategory === cat && activePolicy?.category !== cat}
              onRename={() => {
                setRenameCatDialog({ old: cat });
                setRenameCatValue(cat);
              }}
              onRemove={() => setDeleteCatDialog(cat)}
              onEditPolicy={openEdit}
              onDeletePolicy={(p) =>
                setDeleteDialog({ id: p.id, name: p.name })
              }
              onMovePolicy={(p) => {
                setMoveDialog({ policy: p });
                setMoveTarget("");
              }}
              showCategoryActions={true}
              showMove={categories.length > 1}
            />
          );
        })}

        {/* Uncategorized */}
        {(() => {
          const uncategorized = data.insurancePolicies.filter(
            (p) => !categories.includes(p.category)
          );
          if (uncategorized.length === 0) return null;
          return (
            <DroppableCategory
              category="Uncategorized"
              policies={uncategorized}
              isOver={false}
              onRename={() => {}}
              onRemove={() => {}}
              onEditPolicy={openEdit}
              onDeletePolicy={(p) =>
                setDeleteDialog({ id: p.id, name: p.name })
              }
              onMovePolicy={(p) => {
                setMoveDialog({ policy: p });
                setMoveTarget("");
              }}
              showCategoryActions={false}
              showMove={categories.length > 0}
            />
          );
        })()}

        {/* Drag overlay */}
        <DragOverlay>
          {activePolicy ? (
            <div className="bg-background border rounded-lg shadow-lg p-3 flex items-center gap-3 max-w-md">
              <span className="text-muted-foreground">&#x2630;</span>
              <div>
                <p className="font-medium text-sm">{activePolicy.name}</p>
                <p className="text-xs text-muted-foreground">
                  {TYPE_LABELS[activePolicy.type]} &bull; {activePolicy.provider}
                </p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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

      {/* Move Policy Dialog (fallback) */}
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
              <Select
                value={moveTarget}
                onValueChange={(v) => setMoveTarget(v ?? "")}
              >
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
            <Button variant="outline" onClick={() => setMoveDialog(null)}>
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
                    v &&
                    setForm((f) => ({ ...f, type: v as InsuranceType }))
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
                    v &&
                    setForm((f) => ({
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
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
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
