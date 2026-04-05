"use client";

import { useState, useMemo, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
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
  PieChart,
  Pie,
  Cell,
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
import type { IncomeBreakdownItem } from "@/lib/types";
import { useMask } from "@/lib/mask-context";

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

const BREAKDOWN_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16",
  "#f97316", "#14b8a6",
];

const DEFAULT_BREAKDOWN_ITEMS: Omit<IncomeBreakdownItem, "id">[] = [
  { name: "Base Salary", percentage: 70 },
  { name: "Bonus", percentage: 15 },
  { name: "RSU", percentage: 10 },
  { name: "Other", percentage: 5 },
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
  const isMasked = useMask();
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

  // Editable cell state
  const [editingCell, setEditingCell] = useState<{ personId: string; year: number } | null>(null);
  const [editingValue, setEditingValue] = useState("");

  // Breakdown view state
  const [breakdownPersonId, setBreakdownPersonId] = useState<string | null>(null);
  const [breakdownYear, setBreakdownYear] = useState<number | null>(null);

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

  // Inline editing handlers
  const startEditing = useCallback((personId: string, year: number, currentAmount: number) => {
    setEditingCell({ personId, year });
    setEditingValue(currentAmount > 0 ? currentAmount.toString() : "");
  }, []);

  const saveEditing = useCallback(() => {
    if (!editingCell) return;
    const amount = parseFloat(editingValue);
    if (!isNaN(amount) && amount >= 0) {
      data.setIncomeHistoryEntry(editingCell.personId, editingCell.year, amount);
    }
    setEditingCell(null);
    setEditingValue("");
  }, [editingCell, editingValue, data]);

  const cancelEditing = useCallback(() => {
    setEditingCell(null);
    setEditingValue("");
  }, []);

  // Breakdown helpers
  const activeBreakdown = useMemo(() => {
    if (!breakdownPersonId || !breakdownYear) return null;
    return data.getIncomeBreakdown(breakdownPersonId, breakdownYear);
  }, [breakdownPersonId, breakdownYear, data]);

  const activePersonIncome = useMemo(() => {
    if (!breakdownPersonId || !breakdownYear) return 0;
    const entry = entries.find((e) => e.personId === breakdownPersonId && e.year === breakdownYear);
    return entry?.amount || 0;
  }, [breakdownPersonId, breakdownYear, entries]);

  const breakdownItems = useMemo(() => {
    if (activeBreakdown && activeBreakdown.items.length > 0) return activeBreakdown.items;
    return DEFAULT_BREAKDOWN_ITEMS.map((item) => ({ ...item, id: uuidv4() }));
  }, [activeBreakdown]);

  const breakdownRsuAllocation = activeBreakdown?.rsuAllocationUSD || 0;

  const handleBreakdownItemChange = useCallback((id: string, field: "name" | "percentage", value: string) => {
    if (!breakdownPersonId || !breakdownYear) return;
    const updated = breakdownItems.map((item) => {
      if (item.id === id) {
        if (field === "percentage") {
          const num = parseFloat(value);
          return { ...item, percentage: isNaN(num) ? 0 : Math.max(0, Math.min(100, num)) };
        }
        return { ...item, name: value };
      }
      return item;
    });
    data.setIncomeBreakdownItems(breakdownPersonId, breakdownYear, updated);
  }, [breakdownPersonId, breakdownYear, breakdownItems, data]);

  const handleAddBreakdownItem = useCallback(() => {
    if (!breakdownPersonId || !breakdownYear) return;
    const newItem: IncomeBreakdownItem = { id: uuidv4(), name: "New Category", percentage: 0 };
    data.setIncomeBreakdownItems(breakdownPersonId, breakdownYear, [...breakdownItems, newItem]);
  }, [breakdownPersonId, breakdownYear, breakdownItems, data]);

  const handleRemoveBreakdownItem = useCallback((id: string) => {
    if (!breakdownPersonId || !breakdownYear) return;
    data.setIncomeBreakdownItems(breakdownPersonId, breakdownYear, breakdownItems.filter((item) => item.id !== id));
  }, [breakdownPersonId, breakdownYear, breakdownItems, data]);

  const handleRsuAllocationChange = useCallback((value: string) => {
    if (!breakdownPersonId || !breakdownYear) return;
    const num = parseFloat(value);
    data.setIncomeBreakdownRsuAllocation(breakdownPersonId, breakdownYear, isNaN(num) ? 0 : num);
  }, [breakdownPersonId, breakdownYear, data]);

  const totalBreakdownPercent = breakdownItems.reduce((s, item) => s + item.percentage, 0);

  // Pie chart data for breakdown
  const breakdownChartData = useMemo(() => {
    return breakdownItems
      .filter((item) => item.percentage > 0)
      .map((item, i) => ({
        name: item.name,
        value: item.percentage,
        dollarAmount: (activePersonIncome * item.percentage) / 100,
        color: BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length],
      }));
  }, [breakdownItems, activePersonIncome]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4 text-sm">
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span className="font-mono">{isMasked ? "$•••••" : formatFull(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  const breakdownPerson = persons.find((p) => p.id === breakdownPersonId);

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
                  {isMasked ? "$•••••" : latestEntry ? formatFull(latestEntry.amount) : "$0.00"}
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
                {isMasked ? "$•••••" : formatFull(summaryStats.latestTotal)}
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
                        <YAxis tickFormatter={(v) => isMasked ? "$•••" : formatCompact(v)} tick={{ fontSize: 11 }} width={65} />
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
                    <YAxis tickFormatter={(v) => isMasked ? "$•••" : formatCompact(v)} tick={{ fontSize: 11 }} width={70} />
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
                    <YAxis tickFormatter={(v) => isMasked ? "$•••" : formatCompact(v)} tick={{ fontSize: 11 }} width={70} />
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

      {/* Data Table - Editable */}
      {chartData.length > 0 && persons.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Income History</span>
              <span className="text-xs font-normal text-muted-foreground">Click any amount to edit</span>
            </CardTitle>
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
                    <TableHead className="w-10"></TableHead>
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
                          const isEditing = editingCell?.personId === p.id && editingCell?.year === year;

                          return (
                            <TableCell key={p.id} className="font-mono p-1">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={saveEditing}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEditing();
                                    if (e.key === "Escape") cancelEditing();
                                  }}
                                  className="h-8 w-36 font-mono text-sm"
                                  autoFocus
                                />
                              ) : (
                                <button
                                  className="px-2 py-1 rounded hover:bg-muted/50 transition-colors text-left cursor-pointer w-full"
                                  onClick={() => startEditing(p.id, year, entry?.amount || 0)}
                                  title="Click to edit"
                                >
                                  {entry ? (isMasked ? "$•••••" : formatFull(entry.amount)) : "---"}
                                </button>
                              )}
                            </TableCell>
                          );
                        })}
                        {persons.length > 1 && (
                          <TableCell className="font-mono font-bold">{isMasked ? "$•••••" : formatFull(total)}</TableCell>
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
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setBreakdownPersonId(persons[0]?.id || null);
                              setBreakdownYear(year);
                            }}
                          >
                            Breakdown
                          </Button>
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

      {/* Income Breakdown Section */}
      {breakdownYear !== null && breakdownPersonId && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>Income Breakdown — {breakdownYear}</span>
              </div>
              <div className="flex items-center gap-2">
                <Select value={breakdownPersonId} onValueChange={(v) => v && setBreakdownPersonId(v)}>
                  <SelectTrigger className="w-40 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
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
                <Button variant="ghost" size="sm" className="h-8" onClick={() => { setBreakdownYear(null); setBreakdownPersonId(null); }}>
                  ✕
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Breakdown Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Income: {isMasked ? "$•••••" : formatFull(activePersonIncome)}
                  </p>
                  <Badge
                    variant="secondary"
                    className={totalBreakdownPercent === 100
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                    }
                  >
                    {totalBreakdownPercent.toFixed(0)}% allocated
                  </Badge>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="w-24 text-right">%</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {breakdownItems.map((item, i) => (
                      <TableRow key={item.id}>
                        <TableCell className="p-1">
                          <Input
                            value={item.name}
                            onChange={(e) => handleBreakdownItemChange(item.id, "name", e.target.value)}
                            className="h-8 text-sm border-0 bg-transparent hover:bg-muted/50 focus:bg-background"
                          />
                        </TableCell>
                        <TableCell className="p-1 text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={item.percentage}
                              onChange={(e) => handleBreakdownItemChange(item.id, "percentage", e.target.value)}
                              className="h-8 w-20 text-sm text-right font-mono"
                            />
                            <span className="text-xs text-muted-foreground">%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {isMasked ? "$•••••" : formatFull((activePersonIncome * item.percentage) / 100)}
                        </TableCell>
                        <TableCell className="p-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveBreakdownItem(item.id)}
                          >
                            ×
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between mt-3">
                  <Button variant="outline" size="sm" onClick={handleAddBreakdownItem}>
                    + Add Category
                  </Button>
                </div>

                {/* RSU Allocation */}
                <div className="mt-6 p-4 rounded-lg border bg-violet-500/5 border-violet-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                      RSU Allocation (USD)
                    </Label>
                    <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300 text-xs">
                      Syncs with RSU tab
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    The dollar amount of {breakdownPerson?.name || "this person"}&apos;s {breakdownYear} compensation allocated to RSUs.
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={breakdownRsuAllocation || ""}
                      onChange={(e) => handleRsuAllocationChange(e.target.value)}
                      placeholder="0.00"
                      className="h-9 w-44 font-mono"
                    />
                    {breakdownRsuAllocation > 0 && activePersonIncome > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({((breakdownRsuAllocation / activePersonIncome) * 100).toFixed(1)}% of income)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Pie Chart */}
              <div>
                {breakdownChartData.length > 0 && (
                  <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={breakdownChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={110}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name} ${value}%`}
                          labelLine={{ strokeWidth: 1 }}
                        >
                          {breakdownChartData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => {
                            const item = breakdownChartData.find((d) => d.name === name);
                            return [
                              isMasked ? "$•••••" : formatFull(item?.dollarAmount || 0),
                              `${String(name)} (${value}%)`
                            ];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 justify-center mt-2">
                      {breakdownChartData.map((item) => (
                        <div key={item.name} className="flex items-center gap-1.5 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>{item.name}</span>
                          <span className="font-mono text-muted-foreground">
                            {isMasked ? "$•••" : formatCompact(item.dollarAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
