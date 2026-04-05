"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BillCalendarEntry, CalendarEntryStatus } from "@/lib/types";
import { maskedCurrencyExact } from "@/lib/utils";
import { useMask } from "@/lib/mask-context";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";

interface BillCalendarProps {
  entries: BillCalendarEntry[];
}

const STATUS_COLORS: Record<CalendarEntryStatus, string> = {
  paid: "bg-emerald-500",
  upcoming: "bg-blue-500",
  "due-soon": "bg-orange-500",
  overdue: "bg-red-500",
};

const STATUS_BADGE_VARIANT: Record<CalendarEntryStatus, "default" | "secondary" | "destructive" | "outline"> = {
  paid: "secondary",
  upcoming: "default",
  "due-soon": "outline",
  overdue: "destructive",
};

const TYPE_LABELS: Record<string, string> = {
  "credit-card": "Credit Card",
  affirm: "Affirm/BNPL",
  bill: "Bill",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function BillCalendar({ entries }: BillCalendarProps) {
  const isMasked = useMask();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Group entries by day
  const entriesByDay: Record<number, BillCalendarEntry[]> = useMemo(() => {
    const map: Record<number, BillCalendarEntry[]> = {};
    for (const entry of entries) {
      if (!map[entry.date]) map[entry.date] = [];
      map[entry.date].push(entry);
    }
    return map;
  }, [entries]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Bill Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            >
              &lt;
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            >
              &gt;
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, i) => {
            const day = date.getDate();
            const inMonth = isSameMonth(date, currentMonth);
            const today = isToday(date);
            const dayEntries = inMonth ? entriesByDay[day] || [] : [];

            if (dayEntries.length === 0) {
              return (
                <div
                  key={i}
                  className={`relative flex flex-col items-center justify-start rounded-md p-1 min-h-[48px] text-sm ${
                    !inMonth ? "text-muted-foreground/40" : ""
                  } ${today ? "bg-muted font-bold" : ""}`}
                >
                  <span>{day}</span>
                </div>
              );
            }

            return (
              <Popover key={i}>
                <PopoverTrigger
                  className={`relative flex flex-col items-center justify-start rounded-md p-1 min-h-[48px] text-sm transition-colors hover:bg-muted cursor-pointer ${
                    !inMonth ? "text-muted-foreground/40" : ""
                  } ${today ? "bg-muted font-bold" : ""}`}
                >
                  <span>{day}</span>
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEntries.slice(0, 3).map((entry, j) => (
                      <div
                        key={j}
                        className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[entry.status]}`}
                      />
                    ))}
                    {dayEntries.length > 3 && (
                      <span className="text-[8px] text-muted-foreground">
                        +{dayEntries.length - 3}
                      </span>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" side="top">
                  <p className="mb-2 text-sm font-semibold">
                    {format(date, "MMMM d")}
                  </p>
                  <div className="space-y-2">
                    {dayEntries.map((entry) => (
                      <div
                        key={entry.sourceId}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${STATUS_COLORS[entry.status]}`}
                          />
                          <div>
                            <p className="font-medium">{entry.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {TYPE_LABELS[entry.type]}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{maskedCurrencyExact(entry.amount, isMasked)}</p>
                          <Badge
                            variant={STATUS_BADGE_VARIANT[entry.status]}
                            className="text-[10px] px-1 py-0"
                          >
                            {entry.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Paid</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Upcoming</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-muted-foreground">Due Soon</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Overdue</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
