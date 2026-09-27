import { useMemo, useState } from "react";
import { cx, inr } from "../ui/format";

const DAY_MS = 86400000;

// Orders over the last 7 days — one series, today in the accent, readout on hover / tap
export default function WeeklyActivity({ orders }) {
  const [active, setActive] = useState(null);

  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const out = Array.from({ length: 7 }, (_, i) => ({ date: new Date(today.getTime() - (6 - i) * DAY_MS), count: 0, value: 0 }));
    (orders || []).forEach((o) => {
      if ((o.status || "").toUpperCase() === "CANCELLED") return;
      const t = new Date(o.createdAt || o.date || 0);
      if (isNaN(t.getTime())) return;
      t.setHours(0, 0, 0, 0);
      const idx = Math.round((t.getTime() - out[0].date.getTime()) / DAY_MS);
      if (idx >= 0 && idx < 7) {
        out[idx].count += 1;
        out[idx].value += Number(o.totalAmount || o.total || 0) || 0;
      }
    });
    return out;
  }, [orders]);

  const max = Math.max(1, ...days.map((d) => d.count));
  const focus = active !== null ? days[active] : null;
  const count = focus ? focus.count : days.reduce((a, d) => a + d.count, 0);
  const value = focus ? focus.value : days.reduce((a, d) => a + d.value, 0);

  return (
    <div>
      <p className="text-3xl font-semibold leading-none tracking-tight tabular-nums text-slate-900">
        {count}
        <span className="ml-1.5 text-sm font-medium tracking-normal text-slate-500">{count === 1 ? "order" : "orders"}</span>
      </p>
      <p className="mt-1.5 text-sm tabular-nums text-slate-500" aria-live="polite">
        {focus ? focus.date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" }) : "Last 7 days"} · {inr(value)}
      </p>

      <div className="mt-5 grid h-28 grid-cols-7 items-end gap-2 sm:gap-3" onMouseLeave={() => setActive(null)}>
        {days.map((d, i) => {
          const h = d.count > 0 ? Math.max(8, Math.round((d.count / max) * 100)) : 0;
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onClick={() => setActive(active === i ? null : i)}
              aria-label={`${d.date.toDateString()}: ${d.count} orders, ${inr(d.value)}`}
              className="group flex h-full items-end justify-center rounded-md cursor-pointer"
            >
              {h > 0 ? (
                <span
                  className={cx(
                    "vd-bar block w-full max-w-9 rounded-t-[4px] transition-colors duration-200",
                    i === 6 ? "bg-gradient-to-t from-brand-600 to-amber-400" : active === i ? "bg-sky-500" : "bg-sky-200 group-hover:bg-sky-300"
                  )}
                  style={{ height: `${h}%`, "--i": i }}
                />
              ) : (
                <span className="block h-0.5 w-full max-w-9 rounded-full bg-slate-200" />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2 border-t border-slate-100 pt-2 sm:gap-3">
        {days.map((d, i) => (
          <span key={i} className={cx("text-center text-[11px]", i === 6 ? "font-semibold text-brand-700" : active === i ? "font-semibold text-sky-700" : "text-slate-400")}>
            {i === 6 ? "Today" : d.date.toLocaleDateString("en-IN", { weekday: "short" })}
          </span>
        ))}
      </div>
    </div>
  );
}
