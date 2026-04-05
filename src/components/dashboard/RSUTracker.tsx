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
import type { RSUGrant, StockQuote } from "@/lib/types";
import type { FinanceData } from "@/lib/storage";
import { formatCurrency, maskedCurrency } from "@/lib/utils";
import { useMask } from "@/lib/mask-context";
import { format, isPast, isFuture, differenceInDays } from "date-fns";

function formatCAD(usd: number, rate: number): string {
  return `C$${(usd * rate).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`;
}

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
  const isMasked = useMask();
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [grantFormOpen, setGrantFormOpen] = useState(false);
  const [vestingFormOpen, setVestingFormOpen] = useState(false);
  const [editGrant, setEditGrant] = useState<RSUGrant | undefined>();
  const [selectedGrantId, setSelectedGrantId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    type: "grant" | "vesting";
    grantId: string;
    eventId?: string;
    name: string;
  } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Grant form state
  const [grantForm, setGrantForm] = useState({
    company: "",
    ticker: "",
    grantDate: "",
    totalShares: "",
  });
  // Vesting form state
  const [vestingForm, setVestingForm] = useState({
    date: "",
    shares: "",
    vested: false,
  });

  const fetchQuote = useCallback(async (ticker: string) => {
    const key = ticker.toUpperCase();

    // Check cache first
    const cache = loadCachedQuotes();
    const cached = cache[key];
    if (cached && Date.now() - cached.cachedAt < QUOTE_CACHE_DURATION) {
      setQuotes((prev) => ({ ...prev, [key]: cached }));
      return;
    }

    setLoading((prev) => ({ ...prev, [key]: true }));
    setFetchError(null);

    // Try multiple approaches to fetch stock price
    const apis = [
      // 1. Server-side API route (avoids CORS, sets User-Agent)
      async (): Promise<StockQuote> => {
        const res = await fetch(`/api/stock-quote/${key}`);
        if (!res.ok) throw new Error(`API route HTTP ${res.status}`);
        const json = await res.json();
        if (!json.price) throw new Error("No price data");
        return json as StockQuote;
      },
      // 2. Yahoo Finance via corsproxy.io (fallback)
      async (): Promise<StockQuote> => {
        const url = encodeURIComponent(
          `https://query1.finance.yahoo.com/v8/finance/chart/${key}?interval=1d&range=5d`
        );
        const res = await fetch(`https://corsproxy.io/?url=${url}`);
        if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
        const json = await res.json();
        const meta = json.chart?.result?.[0]?.meta;
        if (!meta || !meta.regularMarketPrice) throw new Error("No data");
        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.previousClose || price;
        return {
          price,
          change: price - prevClose,
          changePercent: prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0,
          lastUpdated: new Date().toISOString(),
        };
      },
      // 3. Direct Yahoo Finance (works in some environments)
      async (): Promise<StockQuote> => {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${key}?interval=1d&range=5d`
        );
        if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
        const json = await res.json();
        const meta = json.chart?.result?.[0]?.meta;
        if (!meta || !meta.regularMarketPrice) throw new Error("No data");
        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.previousClose || price;
        return {
          price,
          change: price - prevClose,
          changePercent: prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0,
          lastUpdated: new Date().toISOString(),
        };
      },
    ];

    let lastError = "";
    for (const apiFn of apis) {
      try {
        const quote = await apiFn();
        if (quote.price > 0) {
          setQuotes((prev) => ({ ...prev, [key]: quote }));
          const updatedCache = loadCachedQuotes();
          updatedCache[key] = { ...quote, cachedAt: Date.now() };
          localStorage.setItem(QUOTE_CACHE_KEY, JSON.stringify(updatedCache));
          setLoading((prev) => ({ ...prev, [key]: false }));
          return;
        }
      } catch (e) {
        lastError = e instanceof Error ? e.message : "Unknown error";
        continue;
      }
    }

    // All APIs failed — check for expired cache
    const expiredCache = loadCachedQuotes();
    if (expiredCache[key]) {
      setQuotes((prev) => ({ ...prev, [key]: expiredCache[key] }));
      setFetchError(`Using cached price for ${key} (last fetched ${format(new Date(expiredCache[key].lastUpdated), "MMM d, h:mm a")}). Live fetch failed.`);
    } else {
      setFetchError(
        `Could not fetch ${key} price. Click "Set Price Manually" and check NASDAQ for the current price.`
      );
    }
    setLoading((prev) => ({ ...prev, [key]: false }));
  }, []);

  // Manual price entry
  const [manualPriceOpen, setManualPriceOpen] = useState(false);
  const [manualTicker, setManualTicker] = useState("");
  const [manualPrice, setManualPrice] = useState("");

  const handleManualPrice = () => {
    const price = parseFloat(manualPrice);
    if (!manualTicker || isNaN(price) || price <= 0) return;
    const key = manualTicker.toUpperCase();
    const quote: StockQuote = {
      price,
      change: 0,
      changePercent: 0,
      lastUpdated: new Date().toISOString(),
    };
    setQuotes((prev) => ({ ...prev, [key]: quote }));
    const cache = loadCachedQuotes();
    cache[key] = { ...quote, cachedAt: Date.now() };
    localStorage.setItem(QUOTE_CACHE_KEY, JSON.stringify(cache));
    setManualPriceOpen(false);
    setManualPrice("");
    setFetchError(null);
  };

  const cadRate = data.exchangeRate.rate;

  // Fetch quotes and exchange rate on mount, auto-refresh every 5 minutes
  useEffect(() => {
    const tickers = [...new Set(data.rsuGrants.map((g) => g.ticker.toUpperCase()))];
    tickers.forEach((t) => fetchQuote(t));
    data.fetchExchangeRate();

    const interval = setInterval(() => {
      tickers.forEach((t) => fetchQuote(t));
      data.fetchExchangeRate();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Calculate totals across all grants
  const totalVestedShares = data.rsuGrants.reduce(
    (sum, g) =>
      sum +
      g.vestingSchedule
        .filter((e) => e.vested)
        .reduce((s, e) => s + e.shares, 0),
    0
  );
  const totalUnvestedShares = data.rsuGrants.reduce(
    (sum, g) =>
      sum +
      g.vestingSchedule
        .filter((e) => !e.vested)
        .reduce((s, e) => s + e.shares, 0),
    0
  );
  const totalAllShares = data.rsuGrants.reduce(
    (sum, g) => sum + g.vestingSchedule.reduce((s, e) => s + e.shares, 0),
    0
  );

  const totalVestedValue = data.rsuGrants.reduce((sum, g) => {
    const quote = quotes[g.ticker.toUpperCase()];
    const vestedShares = g.vestingSchedule
      .filter((e) => e.vested)
      .reduce((s, e) => s + e.shares, 0);
    return sum + (quote ? vestedShares * quote.price : 0);
  }, 0);
  const totalUnvestedValue = data.rsuGrants.reduce((sum, g) => {
    const quote = quotes[g.ticker.toUpperCase()];
    const unvestedShares = g.vestingSchedule
      .filter((e) => !e.vested)
      .reduce((s, e) => s + e.shares, 0);
    return sum + (quote ? unvestedShares * quote.price : 0);
  }, 0);

  // Next vesting event
  const allUpcoming = data.rsuGrants.flatMap((g) =>
    g.vestingSchedule
      .filter((e) => !e.vested && isFuture(new Date(e.date)))
      .map((e) => ({ ...e, ticker: g.ticker, company: g.company }))
  );
  allUpcoming.sort((a, b) => a.date.localeCompare(b.date));
  const nextVesting = allUpcoming[0];

  return (
    <div className="space-y-6">
      {/* Live Stock Price Hero */}
      {[...new Set(data.rsuGrants.map((g) => g.ticker.toUpperCase()))].map(
        (ticker) => {
          const quote = quotes[ticker];
          const isLoading = loading[ticker];
          const tickerGrants = data.rsuGrants.filter(
            (g) => g.ticker.toUpperCase() === ticker
          );
          const tickerVested = tickerGrants.reduce(
            (s, g) =>
              s +
              g.vestingSchedule
                .filter((e) => e.vested)
                .reduce((ss, e) => ss + e.shares, 0),
            0
          );
          const tickerUnvested = tickerGrants.reduce(
            (s, g) =>
              s +
              g.vestingSchedule
                .filter((e) => !e.vested)
                .reduce((ss, e) => ss + e.shares, 0),
            0
          );
          const tickerTotal = tickerVested + tickerUnvested;

          return (
            <Card
              key={ticker}
              className="border-0 shadow-lg bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-blue-500/10"
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Stock info */}
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {ticker}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-3xl font-bold">
                          {quote && quote.price > 0
                            ? isMasked ? "$\u2022\u2022\u2022\u2022\u2022" : `$${quote.price.toFixed(2)}`
                            : isLoading
                            ? "Loading..."
                            : "---"}
                        </h2>
                        {quote && quote.price > 0 && (
                          <Badge
                            variant={
                              quote.change >= 0 ? "secondary" : "destructive"
                            }
                            className={
                              quote.change >= 0
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-sm"
                                : "text-sm"
                            }
                          >
                            {quote.change >= 0 ? "+" : ""}
                            {quote.change.toFixed(2)} (
                            {quote.changePercent.toFixed(2)}%)
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {tickerGrants[0]?.company || ticker} &middot; NASDAQ:{" "}
                        {ticker}
                        {quote?.lastUpdated && (
                          <span>
                            {" "}
                            &middot; Updated{" "}
                            {format(new Date(quote.lastUpdated), "h:mm a")}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchQuote(ticker)}
                      disabled={isLoading}
                    >
                      {isLoading ? "Refreshing..." : "Refresh Price"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setManualTicker(ticker);
                        setManualPrice(
                          quote?.price ? quote.price.toFixed(2) : ""
                        );
                        setManualPriceOpen(true);
                      }}
                    >
                      Set Price Manually
                    </Button>
                  </div>
                </div>

                {/* Value breakdown */}
                {quote && quote.price > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Total Shares
                      </p>
                      <p className="text-xl font-bold">
                        {tickerTotal.toLocaleString()}
                      </p>
                      <p className="text-sm font-semibold text-blue-500">
                        {maskedCurrency(tickerTotal * quote.price, isMasked)} USD
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isMasked ? "C$\u2022\u2022\u2022\u2022\u2022" : formatCAD(tickerTotal * quote.price, cadRate)} CAD
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Vested
                      </p>
                      <p className="text-xl font-bold text-emerald-500">
                        {tickerVested.toLocaleString()}
                      </p>
                      <p className="text-sm font-semibold text-emerald-500">
                        {maskedCurrency(tickerVested * quote.price, isMasked)} USD
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isMasked ? "C$\u2022\u2022\u2022\u2022\u2022" : formatCAD(tickerVested * quote.price, cadRate)} CAD
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Unvested
                      </p>
                      <p className="text-xl font-bold text-violet-500">
                        {tickerUnvested.toLocaleString()}
                      </p>
                      <p className="text-sm font-semibold text-violet-500">
                        {maskedCurrency(tickerUnvested * quote.price, isMasked)} USD
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isMasked ? "C$\u2022\u2022\u2022\u2022\u2022" : formatCAD(tickerUnvested * quote.price, cadRate)} CAD
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Per Share (USD)
                      </p>
                      <p className="text-xl font-bold">
                        {isMasked ? "$\u2022\u2022\u2022\u2022\u2022" : `$${quote.price.toFixed(2)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        live market price
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        USD/CAD Rate
                      </p>
                      <p className="text-xl font-bold">
                        {cadRate.toFixed(4)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {data.exchangeRate.lastUpdated
                          ? `Updated ${format(new Date(data.exchangeRate.lastUpdated), "h:mm a")}`
                          : "Default rate"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        }
      )}

      {/* Error / manual price prompt */}
      {fetchError && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-center justify-between">
          <p className="text-sm text-amber-400">{fetchError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const ticker =
                data.rsuGrants[0]?.ticker.toUpperCase() || "";
              setManualTicker(ticker);
              setManualPrice("");
              setManualPriceOpen(true);
            }}
          >
            Enter Price Manually
          </Button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Vested Value (USD)</p>
            <p className="text-2xl font-bold text-emerald-500">
              {maskedCurrency(totalVestedValue, isMasked)}
            </p>
            <p className="text-xs text-emerald-400">
              {isMasked ? "C$\u2022\u2022\u2022\u2022\u2022" : formatCAD(totalVestedValue, cadRate)} CAD
            </p>
            <p className="text-[10px] text-muted-foreground">
              {totalVestedShares.toLocaleString()} shares
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-500/10 to-violet-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Unvested Value (USD)</p>
            <p className="text-2xl font-bold text-violet-500">
              {maskedCurrency(totalUnvestedValue, isMasked)}
            </p>
            <p className="text-xs text-violet-400">
              {isMasked ? "C$\u2022\u2022\u2022\u2022\u2022" : formatCAD(totalUnvestedValue, cadRate)} CAD
            </p>
            <p className="text-[10px] text-muted-foreground">
              {totalUnvestedShares.toLocaleString()} shares
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Portfolio (USD)</p>
            <p className="text-2xl font-bold text-blue-500">
              {maskedCurrency(totalVestedValue + totalUnvestedValue, isMasked)}
            </p>
            <p className="text-xs text-blue-400">
              {isMasked ? "C$\u2022\u2022\u2022\u2022\u2022" : formatCAD(totalVestedValue + totalUnvestedValue, cadRate)} CAD
            </p>
            <p className="text-[10px] text-muted-foreground">
              {totalAllShares.toLocaleString()} total shares
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500/10 to-amber-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Next Vesting</p>
            {nextVesting ? (
              <>
                <p className="text-xl font-bold text-amber-500">
                  {nextVesting.shares} shares
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(nextVesting.date), "MMM d, yyyy")} (
                  {differenceInDays(new Date(nextVesting.date), new Date())}d
                  away)
                </p>
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-amber-500">---</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No upcoming vests
                </p>
              </>
            )}
          </CardContent>
        </Card>
        {/* RSU Allocation from Income Breakdown */}
        {(() => {
          const currentYear = new Date().getFullYear();
          const allocations = data.incomeBreakdowns
            .filter((b) => b.rsuAllocationUSD > 0)
            .sort((a, b) => b.year - a.year);
          const latestAllocation = allocations.find((a) => a.year === currentYear) || allocations[0];
          if (!latestAllocation) return null;
          const person = data.incomeHistoryPersons.find((p) => p.id === latestAllocation.personId);
          return (
            <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-500/10 to-indigo-600/5">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">RSU Comp Allocation</p>
                <p className="text-2xl font-bold text-indigo-500">
                  {maskedCurrency(latestAllocation.rsuAllocationUSD, isMasked)}
                </p>
                <p className="text-xs text-indigo-400">
                  {isMasked ? "C$\u2022\u2022\u2022\u2022\u2022" : formatCAD(latestAllocation.rsuAllocationUSD, cadRate)} CAD
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {person?.name || "Unknown"} &middot; {latestAllocation.year}
                </p>
              </CardContent>
            </Card>
          );
        })()}
      </div>

      {/* Grants */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">RSU Grants</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditGrant(undefined);
              setGrantForm({
                company: "",
                ticker: "",
                grantDate: new Date().toISOString().slice(0, 10),
                totalShares: "",
              });
              setGrantFormOpen(true);
            }}
          >
            + Add Grant
          </Button>
        </CardHeader>
        <CardContent>
          {data.rsuGrants.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No RSU grants added yet. Add your first grant to start tracking
              your equity.
            </p>
          ) : (
            <div className="space-y-6">
              {data.rsuGrants.map((grant) => {
                const quote = quotes[grant.ticker.toUpperCase()];
                const vestedShares = grant.vestingSchedule
                  .filter((e) => e.vested)
                  .reduce((s, e) => s + e.shares, 0);
                const unvestedShares = grant.vestingSchedule
                  .filter((e) => !e.vested)
                  .reduce((s, e) => s + e.shares, 0);
                const scheduledShares = grant.vestingSchedule.reduce(
                  (s, e) => s + e.shares,
                  0
                );
                const vestPct =
                  scheduledShares > 0
                    ? (vestedShares / scheduledShares) * 100
                    : 0;

                // Chart data for vesting schedule
                const chartData = grant.vestingSchedule
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((e) => ({
                    date: format(new Date(e.date), "MMM yy"),
                    shares: e.shares,
                    vested: e.vested,
                    value: quote ? e.shares * quote.price : 0,
                  }));

                return (
                  <div
                    key={grant.id}
                    className="rounded-lg border p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{grant.company}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{grant.ticker}</Badge>
                          <span className="text-xs text-muted-foreground">
                            Granted{" "}
                            {format(
                              new Date(grant.grantDate),
                              "MMM d, yyyy"
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {quote && quote.price > 0 ? (
                          <>
                            <p className="text-lg font-bold">
                              {maskedCurrency(scheduledShares * quote.price, isMasked)}
                            </p>
                            <p className="text-xs text-emerald-500">
                              {maskedCurrency(vestedShares * quote.price, isMasked)}{" "}
                              vested
                            </p>
                            <p className="text-xs text-violet-500">
                              {maskedCurrency(unvestedShares * quote.price, isMasked)}{" "}
                              unvested
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Set stock price to see values
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Vesting progress bar */}
                    <div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                          style={{
                            width: `${Math.min(vestPct, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {vestedShares.toLocaleString()} vested (
                          {vestPct.toFixed(0)}%)
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {unvestedShares.toLocaleString()} remaining of{" "}
                          {scheduledShares.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Vesting chart */}
                    {chartData.length > 0 && (
                      <div className="h-[140px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
                            margin={{
                              top: 5,
                              right: 5,
                              bottom: 5,
                              left: 0,
                            }}
                          >
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 10, fill: "#9ca3af" }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 10, fill: "#9ca3af" }}
                              tickLine={false}
                              axisLine={false}
                              width={35}
                            />
                            <Tooltip
                              formatter={(value, name) => {
                                if (name === "shares") {
                                  return [
                                    `${value} shares`,
                                    "Shares",
                                  ];
                                }
                                return [
                                  maskedCurrency(Number(value), isMasked),
                                  "Value",
                                ];
                              }}
                              contentStyle={{
                                backgroundColor: "hsl(var(--popover))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "10px",
                                fontSize: "11px",
                                color: "hsl(var(--popover-foreground))",
                              }}
                              labelStyle={{
                                color: "hsl(var(--popover-foreground))",
                              }}
                              itemStyle={{
                                color: "hsl(var(--popover-foreground))",
                              }}
                            />
                            <Bar dataKey="shares" radius={[4, 4, 0, 0]}>
                              {chartData.map((entry, i) => (
                                <Cell
                                  key={i}
                                  fill={
                                    entry.vested ? "#34d399" : "#818cf8"
                                  }
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Vesting schedule table */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">
                          Vesting Schedule
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedGrantId(grant.id);
                            setVestingForm({
                              date: "",
                              shares: "",
                              vested: false,
                            });
                            setVestingFormOpen(true);
                          }}
                        >
                          + Add Vesting Date
                        </Button>
                      </div>
                      {grant.vestingSchedule.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">
                          No vesting events scheduled.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Shares</TableHead>
                                <TableHead>Value (USD)</TableHead>
                                <TableHead>Value (CAD)</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px]">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {grant.vestingSchedule
                                .sort((a, b) =>
                                  a.date.localeCompare(b.date)
                                )
                                .map((event) => {
                                  const eventDate = new Date(event.date);
                                  const daysUntil = differenceInDays(
                                    eventDate,
                                    new Date()
                                  );
                                  const eventValue =
                                    quote && quote.price > 0
                                      ? event.shares * quote.price
                                      : null;
                                  return (
                                    <TableRow key={event.id}>
                                      <TableCell className="text-sm">
                                        {format(eventDate, "MMM d, yyyy")}
                                      </TableCell>
                                      <TableCell className="text-sm font-medium">
                                        {event.shares.toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-sm font-semibold">
                                        {eventValue !== null ? (
                                          <span
                                            className={
                                              event.vested
                                                ? "text-emerald-500"
                                                : "text-violet-500"
                                            }
                                          >
                                            {maskedCurrency(eventValue, isMasked)}
                                          </span>
                                        ) : (
                                          "---"
                                        )}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {eventValue !== null ? (
                                          <span className="text-muted-foreground">
                                            {isMasked ? "C$\u2022\u2022\u2022\u2022\u2022" : formatCAD(eventValue, cadRate)}
                                          </span>
                                        ) : (
                                          "---"
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {event.vested ? (
                                          <Badge
                                            variant="secondary"
                                            className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                                          >
                                            Vested
                                          </Badge>
                                        ) : isPast(eventDate) ? (
                                          <Badge variant="destructive">
                                            Past Due
                                          </Badge>
                                        ) : daysUntil <= 30 ? (
                                          <Badge
                                            variant="outline"
                                            className="border-orange-500 text-orange-500"
                                          >
                                            {daysUntil}d away
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline">
                                            {isFuture(eventDate)
                                              ? `${daysUntil}d away`
                                              : "Pending"}
                                          </Badge>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              data.updateVestingEvent(
                                                grant.id,
                                                event.id,
                                                {
                                                  vested: !event.vested,
                                                }
                                              )
                                            }
                                          >
                                            {event.vested
                                              ? "Unvest"
                                              : "Vest"}
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive"
                                            onClick={() =>
                                              setDeleteDialog({
                                                type: "vesting",
                                                grantId: grant.id,
                                                eventId: event.id,
                                                name: `${event.shares} shares on ${format(eventDate, "MMM d")}`,
                                              })
                                            }
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
                        </div>
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
                        onClick={() =>
                          setDeleteDialog({
                            type: "grant",
                            grantId: grant.id,
                            name: grant.company,
                          })
                        }
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
            <DialogTitle>
              {editGrant ? "Edit RSU Grant" : "Add RSU Grant"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Company</Label>
              <Input
                placeholder="e.g., Dynatrace"
                value={grantForm.company}
                onChange={(e) =>
                  setGrantForm((f) => ({ ...f, company: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Ticker Symbol (NASDAQ)</Label>
              <Input
                placeholder="e.g., DT"
                value={grantForm.ticker}
                onChange={(e) =>
                  setGrantForm((f) => ({
                    ...f,
                    ticker: e.target.value.toUpperCase(),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Grant Date</Label>
              <Input
                type="date"
                value={grantForm.grantDate}
                onChange={(e) =>
                  setGrantForm((f) => ({
                    ...f,
                    grantDate: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Total Shares Granted</Label>
              <Input
                type="number"
                placeholder="0"
                value={grantForm.totalShares}
                onChange={(e) =>
                  setGrantForm((f) => ({
                    ...f,
                    totalShares: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGrantFormOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddGrant}>
              {editGrant ? "Update" : "Add"} Grant
            </Button>
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
                onChange={(e) =>
                  setVestingForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Number of Shares</Label>
              <Input
                type="number"
                placeholder="0"
                value={vestingForm.shares}
                onChange={(e) =>
                  setVestingForm((f) => ({
                    ...f,
                    shares: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={vestingForm.vested}
                onCheckedChange={(checked) =>
                  setVestingForm((f) => ({ ...f, vested: checked }))
                }
              />
              <Label>Already vested</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVestingFormOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddVesting}>Add Vesting Date</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Price Entry Dialog */}
      <Dialog open={manualPriceOpen} onOpenChange={setManualPriceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Stock Price Manually</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              If the live price fetch isn&apos;t working, you can enter the
              current price for <strong>{manualTicker}</strong> manually. Check{" "}
              <a
                href={`https://www.nasdaq.com/market-activity/stocks/${manualTicker.toLowerCase()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-500 underline"
              >
                NASDAQ
              </a>{" "}
              or{" "}
              <a
                href={`https://finance.yahoo.com/quote/${manualTicker}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-500 underline"
              >
                Yahoo Finance
              </a>{" "}
              for the current price.
            </p>
            <div className="space-y-2">
              <Label>Current Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setManualPriceOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleManualPrice}>Set Price</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
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
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
