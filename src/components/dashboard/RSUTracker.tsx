"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RSUGrant, StockQuote, VestingEvent } from "@/lib/types";
import type { FinanceData } from "@/lib/storage";
import { formatCurrency } from "@/lib/utils";
import { format, isPast, isFuture, differenceInDays } from "date-fns";

interface RSUTrackerProps {
  data: FinanceData;
}

const QUOTE_CACHE_KEY = "finance-tracker-stock-quotes";
const QUOTE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function loadCachedQuotes(): Record<string, StockQuote & { cachedAt: number }> {
  try {
    const raw = localStorage.getItem(QUOTE_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function RSUTracker({ data }: RSUTrackerProps) {
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [grantFormOpen, setGrantFormOpen] = useState(false);
  const [vestingFormOpen, setVestingFormOpen] = useState(false);
  const [editGrant, setEditGrant] = useState<RSUGrant | undefined>();
  const [selectedGrantId, setSelectedGrantId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ type: "grant" | "vesting"; grantId: string; eventId?: string; name: string } | null>(null);

  // Grant form state
  const [grantForm, setGrantForm] = useState({ company: "", ticker: "", grantDate: "", totalShares: "" });
  // Vesting form state
  const [vestingForm, setVestingForm] = useState({ date: "", shares: "", vested: false });

  const fetchQuote = useCallback(async (ticker: string) => {
    // Check cache first
    const cache = loadCachedQuotes();
    const cached = cache[ticker.toUpperCase()];
    if (cached && Date.now() - cached.cachedAt < QUOTE_CACHE_DURATION) {
      setQuotes((prev) => ({ ...prev, [ticker.toUpperCase()]: cached }));
      return;
    }

    setLoading((prev) => ({ ...prev, [ticker]: true }));
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${ticker.toUpperCase()}?interval=1d&range=2d`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      const meta = json.chart.result[0].meta;
      const price = meta.regularMarketPrice;
      const prevClose = meta.chartPreviousClose;
      const change = price - prevClose;
      const changePercent = (change / prevClose) * 100;
      const quote: StockQuote = {
        price,
        change,
        changePercent,
        lastUpdated: new Date().toISOString(),
      };
      setQuotes((prev) => ({ ...prev, [ticker.toUpperCase()]: quote }));
      // Save to cache
      const updatedCache = loadCachedQuotes();
      updatedCache[ticker.toUpperCase()] = { ...quote, cachedAt: Date.now() };
      localStorage.setItem(QUOTE_CACHE_KEY, JSON.stringify(updatedCache));
    } catch {
      // If Yahoo fails, try a CORS-friendly fallback
      setQuotes((prev) => ({
        ...prev,
        [ticker.toUpperCase()]: prev[ticker.toUpperCase()] || { price: 0, change: 0, changePercent: 0, lastUpdated: "" },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [ticker]: false }));
    }
  }, []);

  // Fetch quotes for all tickers on mount
  useEffect(() => {
    const tickers = [...new Set(data.rsuGrants.map((g) => g.ticker.toUpperCase()))];
    tickers.forEach((t) => fetchQuote(t));
  }, [data.rsuGrants, fetchQuote]);

  const handleAddGrant = () => {
    if (!grantForm.company || !grantForm.ticker || !grantForm.totalShares) return;
    if (editGrant) {
      data.updateRsuGrant(editGrant.id, {
        company: grantForm.company,
        ticker: grantForm.ticker.toUpperCase(),
        grantDate: grantForm.grantDate,
        totalShares: parseInt(grantForm.totalShares),
      });
    } else {
      data.addRsuGrant({
        company: grantForm.company,
        ticker: grantForm.ticker.toUpperCase(),
        grantDate: grantForm.grantDate,
        totalShares: parseInt(grantForm.totalShares),
      });
    }
    setGrantForm({ company: "", ticker: "", grantDate: "", totalShares: "" });
    setEditGrant(undefined);
    setGrantFormOpen(false);
  };

  const handleAddVesting = () => {
    if (!selectedGrantId || !vestingForm.date || !vestingForm.shares) return;
    data.addVestingEvent(selectedGrantId, {
      date: vestingForm.date,
      shares: parseInt(vestingForm.shares),
      vested: vestingForm.vested,
    });
    setVestingForm({ date: "", shares: "", vested: false });
    setVestingFormOpen(false);
  };

  const handleDelete = () => {
    if (!deleteDialog) return;
    if (deleteDialog.type === "grant") {
      data.deleteRsuGrant(deleteDialog.grantId);
    } else if (deleteDialog.eventId) {
      data.deleteVestingEvent(deleteDialog.grantId, deleteDialog.eventId);
    }
    setDeleteDialog(null);
  };

  // Calculate totals
  const totalVestedShares = data.rsuGrants.reduce(
    (sum, g) => sum + g.vestingSchedule.filter((e) => e.vested).reduce((s, e) => s + e.shares, 0),
    0
  );
  const totalUnvestedShares = data.rsuGrants.reduce(
    (sum, g) => sum + g.vestingSchedule.filter((e) => !e.vested).reduce((s, e) => s + e.shares, 0),
    0
  );
  const totalValue = data.rsuGrants.reduce((sum, g) => {
    const quote = quotes[g.ticker.toUpperCase()];
    const vestedShares = g.vestingSchedule.filter((e) => e.vested).reduce((s, e) => s + e.shares, 0);
    return sum + (quote ? vestedShares * quote.price : 0);
  }, 0);
  const totalUnvestedValue = data.rsuGrants.reduce((sum, g) => {
    const quote = quotes[g.ticker.toUpperCase()];
    const unvestedShares = g.vestingSchedule.filter((e) => !e.vested).reduce((s, e) => s + e.shares, 0);
    return sum + (quote ? unvestedShares * quote.price : 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Vested Value</p>
            <p className="text-2xl font-bold text-emerald-500">{formatCurrency(totalValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{totalVestedShares} shares</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-500/10 to-violet-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Unvested Value</p>
            <p className="text-2xl font-bold text-violet-500">{formatCurrency(totalUnvestedValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{totalUnvestedShares} shares</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Potential</p>
            <p className="text-2xl font-bold text-blue-500">{formatCurrency(totalValue + totalUnvestedValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{totalVestedShares + totalUnvestedShares} shares</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500/10 to-amber-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active Grants</p>
            <p className="text-2xl font-bold text-amber-500">{data.rsuGrants.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {[...new Set(data.rsuGrants.map((g) => g.ticker))].join(", ") || "None"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Prices */}
      {Object.keys(quotes).length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...new Set(data.rsuGrants.map((g) => g.ticker.toUpperCase()))].map((ticker) => {
            const quote = quotes[ticker];
            if (!quote || quote.price === 0) return null;
            return (
              <Card key={ticker} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{ticker}</p>
                    <p className="text-2xl font-bold">${quote.price.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={quote.change >= 0 ? "secondary" : "destructive"}
                      className={quote.change >= 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : ""}
                    >
                      {quote.change >= 0 ? "+" : ""}{quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {quote.lastUpdated ? format(new Date(quote.lastUpdated), "h:mm a") : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchQuote(ticker)}
                    disabled={loading[ticker]}
                    className="ml-2"
                  >
                    {loading[ticker] ? "..." : "Refresh"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Grants */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">RSU Grants</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditGrant(undefined);
              setGrantForm({ company: "", ticker: "", grantDate: new Date().toISOString().slice(0, 10), totalShares: "" });
              setGrantFormOpen(true);
            }}
          >
            + Add Grant
          </Button>
        </CardHeader>
        <CardContent>
          {data.rsuGrants.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No RSU grants added yet. Add your first grant to start tracking your equity.
            </p>
          ) : (
            <div className="space-y-6">
              {data.rsuGrants.map((grant) => {
                const quote = quotes[grant.ticker.toUpperCase()];
                const vestedShares = grant.vestingSchedule.filter((e) => e.vested).reduce((s, e) => s + e.shares, 0);
                const scheduledShares = grant.vestingSchedule.reduce((s, e) => s + e.shares, 0);
                const vestPct = grant.totalShares > 0 ? (vestedShares / grant.totalShares) * 100 : 0;

                // Chart data for vesting schedule
                const chartData = grant.vestingSchedule
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((e) => ({
                    date: format(new Date(e.date), "MMM yy"),
                    shares: e.shares,
                    vested: e.vested,
                  }));

                return (
                  <div key={grant.id} className="rounded-lg border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{grant.company}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{grant.ticker}</Badge>
                          <span className="text-xs text-muted-foreground">
                            Granted {format(new Date(grant.grantDate), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {quote ? formatCurrency(vestedShares * quote.price) : "---"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vestedShares} / {grant.totalShares} vested
                        </p>
                      </div>
                    </div>

                    {/* Vesting progress bar */}
                    <div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                          style={{ width: `${Math.min(vestPct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">{vestPct.toFixed(0)}% vested</span>
                        <span className="text-[10px] text-muted-foreground">
                          {scheduledShares} / {grant.totalShares} scheduled
                        </span>
                      </div>
                    </div>

                    {/* Vesting chart */}
                    {chartData.length > 0 && (
                      <div className="h-[120px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} width={35} />
                            <Tooltip
                              formatter={(value) => [`${value} shares`, "Shares"]}
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
                            <Bar dataKey="shares" radius={[4, 4, 0, 0]}>
                              {chartData.map((entry, i) => (
                                <Cell key={i} fill={entry.vested ? "#34d399" : "#818cf8"} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Vesting schedule table */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Vesting Schedule</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedGrantId(grant.id);
                            setVestingForm({ date: "", shares: "", vested: false });
                            setVestingFormOpen(true);
                          }}
                        >
                          + Add Vesting Date
                        </Button>
                      </div>
                      {grant.vestingSchedule.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">No vesting events scheduled.</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Shares</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {grant.vestingSchedule
                              .sort((a, b) => a.date.localeCompare(b.date))
                              .map((event) => {
                                const eventDate = new Date(event.date);
                                const daysUntil = differenceInDays(eventDate, new Date());
                                return (
                                  <TableRow key={event.id}>
                                    <TableCell className="text-sm">
                                      {format(eventDate, "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">{event.shares}</TableCell>
                                    <TableCell className="text-sm">
                                      {quote ? formatCurrency(event.shares * quote.price) : "---"}
                                    </TableCell>
                                    <TableCell>
                                      {event.vested ? (
                                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                                          Vested
                                        </Badge>
                                      ) : isPast(eventDate) ? (
                                        <Badge variant="destructive">Past Due</Badge>
                                      ) : daysUntil <= 30 ? (
                                        <Badge variant="outline" className="border-orange-500 text-orange-500">
                                          {daysUntil}d away
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline">
                                          {isFuture(eventDate) ? `${daysUntil}d away` : "Pending"}
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => data.updateVestingEvent(grant.id, event.id, { vested: !event.vested })}
                                        >
                                          {event.vested ? "Unvest" : "Vest"}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-destructive"
                                          onClick={() => setDeleteDialog({ type: "vesting", grantId: grant.id, eventId: event.id, name: `${event.shares} shares on ${format(eventDate, "MMM d")}` })}
                                        >
                                          Del
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      )}
                    </div>

                    {/* Grant actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditGrant(grant);
                          setGrantForm({
                            company: grant.company,
                            ticker: grant.ticker,
                            grantDate: grant.grantDate,
                            totalShares: grant.totalShares.toString(),
                          });
                          setGrantFormOpen(true);
                        }}
                      >
                        Edit Grant
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeleteDialog({ type: "grant", grantId: grant.id, name: grant.company })}
                      >
                        Delete Grant
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Grant Dialog */}
      <Dialog open={grantFormOpen} onOpenChange={setGrantFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editGrant ? "Edit RSU Grant" : "Add RSU Grant"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Company</Label>
              <Input
                placeholder="e.g., Microsoft"
                value={grantForm.company}
                onChange={(e) => setGrantForm((f) => ({ ...f, company: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Ticker Symbol</Label>
              <Input
                placeholder="e.g., MSFT"
                value={grantForm.ticker}
                onChange={(e) => setGrantForm((f) => ({ ...f, ticker: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Grant Date</Label>
              <Input
                type="date"
                value={grantForm.grantDate}
                onChange={(e) => setGrantForm((f) => ({ ...f, grantDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Shares Granted</Label>
              <Input
                type="number"
                placeholder="0"
                value={grantForm.totalShares}
                onChange={(e) => setGrantForm((f) => ({ ...f, totalShares: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantFormOpen(false)}>Cancel</Button>
            <Button onClick={handleAddGrant}>{editGrant ? "Update" : "Add"} Grant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Vesting Event Dialog */}
      <Dialog open={vestingFormOpen} onOpenChange={setVestingFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vesting Date</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Vesting Date</Label>
              <Input
                type="date"
                value={vestingForm.date}
                onChange={(e) => setVestingForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Number of Shares</Label>
              <Input
                type="number"
                placeholder="0"
                value={vestingForm.shares}
                onChange={(e) => setVestingForm((f) => ({ ...f, shares: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={vestingForm.vested}
                onCheckedChange={(checked) => setVestingForm((f) => ({ ...f, vested: checked }))}
              />
              <Label>Already vested</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVestingFormOpen(false)}>Cancel</Button>
            <Button onClick={handleAddVesting}>Add Vesting Date</Button>
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
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
