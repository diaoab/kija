"use client";

import { useMemo, useState } from "react";

type Period = { startDate: Date; endDate: Date };

const WEEKDAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isBeforeMonth(a: Date, b: Date) {
  return a.getFullYear() < b.getFullYear() || (a.getFullYear() === b.getFullYear() && a.getMonth() < b.getMonth());
}

/** Une nuit est bloquée si elle tombe dans [startDate, endDate[ d'une réservation confirmée. */
function isWithinAnyPeriod(date: Date, periods: Period[]) {
  return periods.some(
    (period) => date >= startOfDay(period.startDate) && date < startOfDay(period.endDate)
  );
}

export default function AvailabilityCalendar({
  unavailablePeriods,
  startName,
  endName,
}: {
  unavailablePeriods: Period[];
  startName: string;
  endName: string;
}) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [range, setRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [error, setError] = useState<string | null>(null);

  const isBlocked = (date: Date) => date < today || isWithinAnyPeriod(date, unavailablePeriods);

  const hasBlockedBetween = (a: Date, b: Date) => {
    const cursor = new Date(a);
    cursor.setDate(cursor.getDate() + 1);
    while (cursor < b) {
      if (isBlocked(cursor)) return true;
      cursor.setDate(cursor.getDate() + 1);
    }
    return false;
  };

  const handleDayClick = (date: Date) => {
    if (isBlocked(date)) return;
    setError(null);

    if (!range.start || (range.start && range.end)) {
      setRange({ start: date, end: null });
      return;
    }

    if (date <= range.start) {
      setRange({ start: date, end: null });
      return;
    }

    if (hasBlockedBetween(range.start, date)) {
      setError("Cette période inclut des dates déjà réservées. Choisissez une autre plage.");
      setRange({ start: date, end: null });
      return;
    }

    setRange({ start: range.start, end: date });
  };

  const daysInMonth = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Grille commençant le lundi (getDay(): 0 = dimanche).
    const firstWeekday = (firstDay.getDay() + 6) % 7;

    const days: (Date | null)[] = Array(firstWeekday).fill(null);
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  }, [visibleMonth]);

  const canGoBack = isBeforeMonth(new Date(today.getFullYear(), today.getMonth(), 1), visibleMonth);

  return (
    <div>
      <input type="hidden" name={startName} value={range.start ? toISODate(range.start) : ""} />
      <input type="hidden" name={endName} value={range.end ? toISODate(range.end) : ""} />

      <div className="rounded-lg border border-border bg-background p-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            disabled={!canGoBack}
            aria-label="Mois précédent"
            className="rounded-full px-2 py-1 text-sm transition-colors hover:bg-foreground/5 disabled:opacity-20"
          >
            ←
          </button>
          <span className="text-sm font-medium">
            {MONTH_NAMES[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
          </span>
          <button
            type="button"
            onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            aria-label="Mois suivant"
            className="rounded-full px-2 py-1 text-sm transition-colors hover:bg-foreground/5"
          >
            →
          </button>
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {daysInMonth.map((date, index) => {
            if (!date) return <span key={`empty-${index}`} />;

            const blocked = isBlocked(date);
            const isStart = Boolean(range.start && date.getTime() === range.start.getTime());
            const isEnd = Boolean(range.end && date.getTime() === range.end.getTime());
            const inRange = Boolean(range.start && range.end && date > range.start && date < range.end);

            return (
              <button
                key={date.toISOString()}
                type="button"
                disabled={blocked}
                onClick={() => handleDayClick(date)}
                aria-label={toISODate(date)}
                className={`aspect-square rounded-md text-xs transition-colors ${
                  blocked
                    ? "cursor-not-allowed bg-foreground/5 text-muted line-through"
                    : isStart || isEnd
                      ? "bg-foreground text-background"
                      : inRange
                        ? "bg-foreground/10 text-foreground"
                        : "text-foreground hover:bg-foreground/10"
                }`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-2 text-xs text-muted">
        {range.start && range.end
          ? `Du ${range.start.toLocaleDateString("fr-FR")} au ${range.end.toLocaleDateString("fr-FR")}`
          : range.start
            ? "Choisissez la date de départ."
            : "Choisissez la date d'arrivée. Les dates grisées sont déjà réservées."}
      </p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
