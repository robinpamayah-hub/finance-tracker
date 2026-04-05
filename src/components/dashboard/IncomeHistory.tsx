"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FinanceData } from "@/lib/storage";
import { formatCurrencyExact } from "@/lib/utils";

interface IncomeHistoryProps {
  data: FinanceData;
}

const PRESET_COLORS = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

function formatCompact(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatFull(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function IncomeHistory({ data }: IncomeHistoryProps) {
  const [personFormOpen, setPersonFormOpen] = useState(false);
  const [editPerson, setEditPerson] = useState<string | null>(null);
  const [personName, setPersonName] = useState("");
  const [personColor, setPersonColor] = useState(PRESET_COLORS[0]);
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; name: string } | null>(null);
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [entryPersonId, setEntryPersonId] = useState("");
  const [entryYear, setEntryYear] = useState(new Date().getFullYear().toString());
  const [entryAmount, setEntryAmount] = useState("");
  const [chartView, setChartView] = useState<"individual" | "combined" | "comparison">("individual");

  const persons = data.incomeHistoryPersons;
  const entries = data.incomeHistoryEntries;

  // Get all unique years, sorted
  const years = useMemo(() => {
    const yearSet = new Set(entries.map((e) => e.year));
    return Array.from(yearSet).sort((a, b) => a - b);
  }, [entries]);

  // Build chart data
  const chartData = useMemo(() => {
    return years.map((year) => {
      const row: Record<string, number | string> = { year: year.toString() };
      let combined = 0;
      persons.forEach((p) => {
        const entry = entries.find((e) => e.personId === p.id && e.year === year);
        const amount = entry?.amount || 0;
        row[p.name] = amount;
        combined += amount;
      });
      row["Combined"] = combined;
      return row;
    });
  }, [years, persons, entries]);

  // Summary stats
  const summaryStats = useMemo(() => {
    if (years.length === 0) return null;
    const latestYear = years[years.length - 1];
    const prevYear = years.length > 1 ? years[years.length - 2] : null;

    let latestTotal = 0;
    let prevTotal = 0;
    persons.forEach((p) => {
      const latest = entries.find((e) => e.personId === p.id && e.year === latestYear);
      latestTotal += latest?.amount || 0;
      if (prevYear) {
        const prev = entries.find((e) => e.personId === p.id && e.year === prevYear);
        prevTotal += prev?.amount || 0;
      }
    });

    const growth = prevTotal > 0 ? ((latestTotal - prevTotal) / prevTotal) * 100 : 0;
    const firstYear = years[0];
    let firstTotal = 0;
    persons.forEach((p) => {
      const entry = entries.find((e) => e.personId === p.id && e.year === firstYear);
      firstTotal += entry?.amount || 0;
    });
    const totalGrowth = firstTotal > 0 ? ((latestTotal - firstTotal) / firstTotal) * 100 : 0;

    return { latestYear, latestTotal, growth, totalGrowth, firstYear, firstTotal };
  }, [years, persons, entries]);

  const handleAddPerson = () => {
    if (!personName.trim()) return;
    if (editPerson) {
      data.updateIncomeHistoryPerson(editPerson, { name: personName.trim(), color: personColor });
      setEditPerson(null);
    } else {
      data.addIncomeHistoryPerson({ name: personName.trim(), color: personColor });
    }
    setPersonName("");
    setPersonColor(PRESET_COLORS[persons.length % PRESET_COLORS.length]);
    setPersonFormOpen(false);
  };

  const handleAddEntry = () => {
    if (!entryPersonId || !entryYear || !entryAmount) return;
    data.setIncomeHistoryEntry(entryPersonId, parseInt(entryYear), parseFloat(entryAmount));
    setEntryAmount("");
    setEntryFormOpen(false);
  };

  const handleDeletePerson = () => {
    if (!deleteDialog) return;
    data.deleteIncomeHistoryPerson(deleteDialog.id);
    setDeleteDialog(null);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4 text-sm">
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span className="font-mono">{formatFull(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {persons.map((person) => {
          const latestYear = years.length > 0 ? years[years.length - 1] : null;
          const latestEntry = latestYear
            ? entries.find((e) => e.personId === person.id && e.year === latestYear)
            : null;
          const prevYear = years.length > 1 ? years[years.length - 2] : null;
          const prevEntry = prevYear
            ? entries.find((e) => e.personId === person.id && e.year === prevYear)
            : null;
          const yoyGrowth =
            prevEntry && prevEntry.amount > 0
              ? ((( latestEntry?.amount || 0) - prevEntry.amount) / prevEntry.amount) * 100
              : null;
          return (
            <Card key={person.id} className="border-0 shadow-sm overflow-hidden">
              <div className="h-1" style={{ backgroundColor: person.color }} />
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">{person.name}</p>
                  {yoyGrowth !== null && (
                    <Badge
                      variant="secondary"
                      className={yoyGrowth >= 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}
                    >
                      {yoyGrowth >= 0 ? "+" : ""}{yoyGrowth.toFixed(1)}% YoY
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold" style={{ color: person.color }}>
                  {latestEntry ? formatFull(latestEntry.amount) : "$0.00"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {latestYear || "No data"}{latestYear ? ` income` : ""}
                </p>
              </CardContent>
            </Card>
          );
        })}

        {/* Combined card */}
        {persons.length > 1 && summaryStats && (
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-amber-500" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">Combined Household</p>
                {summaryStats.growth !== 0 && (
                  <Badge
                    variant="secondary"
                    className={summaryStats.growth >= 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}
                  >
                    {summaryStats.growth >= 0 ? "+" : ""}{summaryStats.growth.toFixed(1)}% YoY
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatFull(summaryStats.latestTotal)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summaryStats.latestYear} combined income
              </p>
            </CardContent>
          </Card>
        )}

        {/* Total growth card */}
        {summaryStats && years.length > 1 && (
          <Card className="border-0 shadow-sm overflow-hidden bg-gradient-to-br from-violet-500/10 to-violet-600/5">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Growth</p>
              <p className="text-2xl font-bold text-violet-500">
                {summaryStats.totalGrowth >= 0 ? "+" : ""}{summaryStats.totalGrowth.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summaryStats.firstYear} to {summaryStats.latestYear}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditPerson(null);
              setPersonName("");
              setPersonColor(PRESET_COLORS[persons.length % PRESET_COLORS.length]);
              setPersonFormOpen(true);
            }}
          >
            + Add Person
          </Button>
          {persons.length > 0 && (
            <Button
              onClick={() => {
                setEntryPersonId(persons[0]?.id || "");
                setEntryYear(new Date().getFullYear().toString());
                setEntryAmount("");
                setEntryFormOpen(true);
              }}
            >
              + Add Income Entry
            </Button>
          )}
        </div>
        {chartData.length > 0 && (
          <div className="flex gap-1">
            <Button
              variant={chartView === "individual" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartView("individual")}
            >
              Individual
            </Button>
            <Button
              variant={chartView === "combined" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartView("combined")}
            >
              Combined
            </Button>
            <Button
              variant={chartView === "comparison" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartView("comparison")}
            >
              Side by Side
            </Button>
          </div>
        )}
      </div>

      {/* Charts */}
      {chartData.length > 0 && persons.length > 0 && (
        <>
          {chartView === "individual" && (
            <div className={`grid gap-6 ${persons.length === 1 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
              {persons.map((person) => (
                <Card key={person.id} className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: person.color }} />
                      {person.name}&apos;s Income
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id={`grad-${person.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={person.color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={person.color} stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11 }} width={65} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey={person.name}
                          stroke={person.color}
                          strokeWidth={3}
                          fill={`url(#grad-${person.id})`}
                          dot={{ r: 5, fill: person.color, strokeWidth: 2, stroke: "#fff" }}
                          activeDot={{ r: 7 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {chartView === "combined" && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Combined Household Income</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="grad-combined" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11 }} width={70} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="Combined"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fill="url(#grad-combined)"
                      dot={{ r: 5, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 7 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {chartView === "comparison" && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Income Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11 }} width={70} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {persons.map((person) => (
                      <Bar
                        key={person.id}
                        dataKey={person.name}
                        fill={person.color}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={60}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Data Table */}
      {chartData.length > 0 && persons.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Income History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    {persons.map((p) => (
                      <TableHead key={p.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                          {p.name}
                        </div>
                      </TableHead>
                    ))}
                    {persons.length > 1 && <TableHead className="font-bold">Combined</TableHead>}
                    <TableHead>YoY Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {years.map((year, idx) => {
                    let total = 0;
                    let prevTotal = 0;
                    persons.forEach((p) => {
                      const entry = entries.find((e) => e.personId === p.id && e.year === year);
                      total += entry?.amount || 0;
                      if (idx > 0) {
                        const prevEntry = entries.find((e) => e.personId === p.id && e.year === years[idx - 1]);
                        prevTotal += prevEntry?.amount || 0;
                      }
                    });
                    const yoyGrowth = idx > 0 && prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null;
                    return (
                      <TableRow key={year}>
                        <TableCell className="font-semibold">{year}</TableCell>
                        {persons.map((p) => {
                          const entry = entries.find((e) => e.personId === p.id && e.year === year);
                          return (
                            <TableCell key={p.id} className="font-mono">
                              {entry ? formatFull(entry.amount) : "---"}
                            </TableCell>
                          );
                        })}
                        {persons.length > 1 && (
                          <TableCell className="font-mono font-bold">{formatFull(total)}</TableCell>
                        )}
                        <TableCell>
                          {yoyGrowth !== null ? (
                            <Badge
                              variant="secondary"
                              className={yoyGrowth >= 0
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              }
                            >
                              {yoyGrowth >= 0 ? "+" : ""}{yoyGrowth.toFixed(1)}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">---</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* People management */}
      {persons.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">People</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {persons.map((p) => (
                <div key={p.id} className="flex items-center gap-2 border rounded-lg px-3 py-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-sm font-medium">{p.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      setEditPerson(p.id);
                      setPersonName(p.name);
                      setPersonColor(p.color);
                      setPersonFormOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-destructive"
                    onClick={() => setDeleteDialog({ id: p.id, name: p.name })}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {persons.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">Track Your Income History</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Add people to track and compare yearly income over time. See trends, growth rates, and combined household income at a glance.
            </p>
            <Button
              onClick={() => {
                setPersonName("");
                setPersonColor(PRESET_COLORS[0]);
                setEditPerson(null);
                setPersonFormOpen(true);
              }}
            >
              + Add First Person
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Person Dialog */}
      <Dialog open={personFormOpen} onOpenChange={setPersonFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editPerson ? "Edit Person" : "Add Person"}</DialogTitle>
            <DialogDescription>
              Add someone to track their annual income over time.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="person-name">Name</Label>
              <Input
                id="person-name"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="e.g., Robin"
                onKeyDown={(e) => e.key === "Enter" && handleAddPerson()}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label>Chart Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`w-8 h-8 rounded-full transition-all ${
                      personColor === c ? "ring-2 ring-offset-2 ring-offset-background scale-110" : "opacity-70 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setPersonColor(c)}
                    type="button"
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPersonFormOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPerson}>{editPerson ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Income Entry Dialog */}
      <Dialog open={entryFormOpen} onOpenChange={setEntryFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Income Entry</DialogTitle>
            <DialogDescription>
              Enter annual income for a specific year. Updating an existing year will overwrite it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Person</Label>
              <Select value={entryPersonId} onValueChange={(v) => v && setEntryPersonId(v)}>
                <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
                <SelectContent>
                  {persons.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="entry-year">Year</Label>
              <Input
                id="entry-year"
                type="number"
                value={entryYear}
                onChange={(e) => setEntryYear(e.target.value)}
                min={1990}
                max={2100}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="entry-amount">Annual Income ($)</Label>
              <Input
                id="entry-amount"
                type="number"
                step="0.01"
                value={entryAmount}
                onChange={(e) => setEntryAmount(e.target.value)}
                placeholder="e.g., 117715.52"
                onKeyDown={(e) => e.key === "Enter" && handleAddEntry()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryFormOpen(false)}>Cancel</Button>
            <Button onClick={handleAddEntry}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Person Confirmation */}
      <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Person</DialogTitle>
            <DialogDescription>
              Remove &quot;{deleteDialog?.name}&quot; and all their income history? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePerson}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
