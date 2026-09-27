import { useLayoutEffect, useRef, useState } from "react";
import { mapsUrl } from "../../orderView";
import { MapPinIcon, ArrowUpRightIcon, ChevronDownIcon } from "../../ui/icons";
import { cx } from "../../ui/format";

// Delivery site: street clamped to two lines (expandable), locality + pincode, and a Directions link
export default function OrderAddress({ party }) {
  const [expanded, setExpanded] = useState(false);
  const { street, city, pincode } = party;
  const textRef = useRef(null);
  const [isClamped, setIsClamped] = useState(false);

  // Offer "Show full address" only when the street really overflows two lines at this width
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || expanded) return;
    const measure = () => setIsClamped(el.scrollHeight > el.clientHeight + 1);
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [street, expanded]);

  return (
    <div className="flex gap-2.5 rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-inset ring-slate-200/80">
      <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
      <div className="min-w-0 flex-1">
        <p ref={textRef} className={cx("break-words text-sm leading-snug text-slate-700", !expanded && "line-clamp-2")}>{street || "Site address not shared"}</p>
        {(isClamped || expanded) && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="mt-0.5 inline-flex items-center gap-0.5 text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            {expanded ? "Show less" : "Show full address"}
            <ChevronDownIcon className={cx("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
          </button>
        )}
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <p className="truncate text-xs font-medium text-slate-500">{[city, pincode].filter(Boolean).join(" · ")}</p>
          {(street || city) && (
            <a
              href={mapsUrl(party)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Directions
              <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
