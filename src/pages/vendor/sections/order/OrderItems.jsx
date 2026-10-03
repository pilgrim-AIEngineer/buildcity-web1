import { useState } from "react";
import { inr } from "../../ui/format";

// Up to this many rows show in full; longer orders fold to PREVIEW_ROWS + "+N more"
const MAX_ROWS_UNFOLDED = 4;
const PREVIEW_ROWS = 3;

// One line per item ("50 × Name … ₹line"); tap a row for its unit rate. Delivery closes the list.
export default function OrderItems({ items, deliveryFee, splitOf, discountAmount, couponCode }) {
  const [expanded, setExpanded] = useState(false);
  const [rateFor, setRateFor] = useState(null);
  const foldable = items.length > MAX_ROWS_UNFOLDED;
  const visible = foldable && !expanded ? items.slice(0, PREVIEW_ROWS) : items;
  const hidden = items.length - visible.length;

  return (
    <div className="text-sm">
      {(items.length > 1 || splitOf > 0) && (
        <p className="mb-1 text-xs text-slate-400">
          {items.length} {items.length === 1 ? "item" : "items"}
          {splitOf > 0 && <span title="The rest of this customer's order comes from other shops"> · {items.length} of {splitOf} from you</span>}
        </p>
      )}

      <ul className="space-y-1">
        {visible.map((it) => {
          const showRate = rateFor === it.key && it.unitPrice > 0;
          return (
            <li key={it.key}>
              <button
                type="button"
                onClick={() => setRateFor(showRate ? null : it.key)}
                className="flex w-full items-baseline gap-2 text-left cursor-pointer"
                aria-expanded={showRate}
              >
                <span className="w-9 shrink-0 tabular-nums text-slate-400">{it.qty} ×</span>
                <span className="min-w-0 flex-1 truncate text-slate-800" title={it.name}>
                  {it.name}
                </span>
                <span className="shrink-0 tabular-nums text-slate-800">{inr(it.lineTotal)}</span>
              </button>
              {showRate && <p className="pl-11 text-xs tabular-nums text-slate-400">{inr(it.unitPrice)} each</p>}
            </li>
          );
        })}
        {foldable && (
          <li>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="pl-11 text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              {expanded ? "Show fewer" : `+${hidden} more ${hidden === 1 ? "item" : "items"}`}
            </button>
          </li>
        )}
        <li className="flex items-baseline gap-2 text-slate-400">
          <span className="w-9 shrink-0" />
          <span className="flex-1">Delivery</span>
          <span className="shrink-0 tabular-nums">{deliveryFee > 0 ? inr(deliveryFee) : "Free"}</span>
        </li>
        {Number(discountAmount) > 0 && (
          <li className="flex items-baseline gap-2 text-emerald-700 font-semibold bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200/80">
            <span className="w-7 shrink-0 text-center">🏷️</span>
            <span className="flex-1">Coupon ({couponCode || "Promo"})</span>
            <span className="shrink-0 tabular-nums">− {inr(discountAmount)}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
