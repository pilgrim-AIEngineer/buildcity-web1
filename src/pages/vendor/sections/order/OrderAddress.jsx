import { useLayoutEffect, useRef, useState } from "react";
import { mapsUrl } from "../../orderView";
import { MapPinIcon, ArrowUpRightIcon } from "../../ui/icons";
import { cx } from "../../ui/format";

// Delivery site as plain text: street + locality clamped to two lines (tap "more" to expand) and a Map link
export default function OrderAddress({ party }) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const textRef = useRef(null);
  const { street, city, pincode } = party;
  const text = [street, [city, pincode].filter(Boolean).join(" ")].filter(Boolean).join(", ");

  // Offer "more" only when the address really overflows two lines at this width
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || expanded) return;
    const measure = () => setIsClamped(el.scrollHeight > el.clientHeight + 1);
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [text, expanded]);

  return (
    <div className="flex items-start gap-2">
      <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1">
        <p ref={textRef} className={cx("break-words text-sm leading-snug text-slate-600", !expanded && "line-clamp-2")}>
          {text || "Site address not shared"}
        </p>
        {(isClamped || expanded) && (
          <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="text-xs font-medium text-slate-400 hover:text-slate-700 cursor-pointer">
            {expanded ? "less" : "more"}
          </button>
        )}
      </div>
      {text && (
        <a
          href={mapsUrl(party)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-0.5 pt-px text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          Map
          <ArrowUpRightIcon className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}
