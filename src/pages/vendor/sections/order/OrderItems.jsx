import { useState } from "react";
import { ChevronDownIcon } from "../../ui/icons";
import { cx, inr } from "../../ui/format";

// Up to this many rows show in full; longer orders fold to PREVIEW_ROWS + "+N more"
const MAX_ROWS_UNFOLDED = 4;
const PREVIEW_ROWS = 3;

// Line items: quantity chip · name + unit rate · line total
export default function OrderItems({ items, splitOf }) {
  const [expanded, setExpanded] = useState(false);
  const foldable = items.length > MAX_ROWS_UNFOLDED;
  const visible = foldable && !expanded ? items.slice(0, PREVIEW_ROWS) : items;
  const hidden = items.length - visible.length;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {items.length} {items.length === 1 ? "item" : "items"}
        </h4>
        {splitOf > 0 && (
          <span className="text-[11px] text-slate-400" title="The rest of this customer's order comes from other shops">
            Split order · {items.length} of {splitOf} yours
          </span>
        )}
      </div>

      <ul className="mt-1 divide-y divide-slate-100">
        {visible.map((it) => (
          <li key={it.key} className="flex items-center gap-2.5 py-2">
            <span className="grid h-7 min-w-9 shrink-0 place-items-center rounded-lg bg-slate-100 px-1.5 text-xs font-semibold tabular-nums text-slate-800">
              {it.qty}×
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm leading-snug text-slate-800" title={it.name}>
                {it.name}
              </p>
              {it.unitPrice > 0 && <p className="text-xs tabular-nums text-slate-400">@ {inr(it.unitPrice)}</p>}
            </div>
            <span className="shrink-0 text-sm font-medium tabular-nums text-slate-800">{inr(it.lineTotal)}</span>
          </li>
        ))}
      </ul>

      {foldable && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
        >
          {expanded ? "Show fewer" : `+${hidden} more ${hidden === 1 ? "item" : "items"}`}
          <ChevronDownIcon className={cx("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
        </button>
      )}
    </div>
  );
}
