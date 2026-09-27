import { useEffect, useId, useRef, useState } from "react";
import { CheckIcon, ClockIcon, CloseIcon, SearchIcon } from "./icons";
import { cx, ORDER_STATUS } from "./format";

export function StatusBadge({ status }) {
  const key = (status || "PENDING").toUpperCase();
  const cfg = ORDER_STATUS[key] || { label: status || "Pending", tone: "bg-slate-100 text-slate-600 ring-slate-500/20", dot: "bg-slate-400" };
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap", cfg.tone)}>
      {key === "DELIVERED" ? (
        <CheckIcon className="h-3 w-3" strokeWidth={2.5} />
      ) : key === "CANCELLED" ? (
        <CloseIcon className="h-3 w-3" strokeWidth={2.5} />
      ) : (
        <span className={cx("h-1.5 w-1.5 rounded-full", cfg.dot)} aria-hidden="true" />
      )}
      {cfg.label}
    </span>
  );
}

export function ApprovalBadge({ status }) {
  const base = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap";
  if (status === "PENDING_REVIEW") {
    return (
      <span className={cx(base, "bg-amber-50 text-amber-800 ring-amber-600/20")}>
        <ClockIcon className="h-3 w-3" strokeWidth={2} />
        In review
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className={cx(base, "bg-rose-50 text-rose-700 ring-rose-600/20")}>
        <CloseIcon className="h-3 w-3" strokeWidth={2.5} />
        Rejected
      </span>
    );
  }
  return (
    <span className={cx(base, "bg-emerald-50 text-emerald-700 ring-emerald-600/20")}>
      <CheckIcon className="h-3 w-3" strokeWidth={2.5} />
      Live
    </span>
  );
}

const BUTTON_VARIANTS = {
  primary: "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-[0_1px_2px_rgba(154,52,18,0.25),inset_0_1px_0_rgba(255,255,255,0.14)] hover:from-brand-600 hover:to-brand-700 active:to-brand-700",
  dark: "bg-navy-950 text-white hover:bg-[#0d224d] active:bg-[#0d224d]",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100 active:bg-emerald-100",
  secondary: "bg-white text-slate-800 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 active:bg-slate-100",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200",
  danger: "bg-white text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-50 active:bg-rose-100",
};

const BUTTON_SIZES = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
};

export function Button({ variant = "primary", size = "md", className = "", as: As = "button", ...props }) {
  const extra = As === "button" && !props.type ? { type: "button" } : {};
  return (
    <As
      {...extra}
      {...props}
      className={cx(
        "inline-flex items-center justify-center rounded-xl font-semibold transition-[color,background-color,box-shadow,transform] duration-150 active:scale-[0.98] cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className
      )}
    />
  );
}

export function Card({ className = "", children, ...rest }) {
  return (
    <div className={cx("rounded-2xl border border-slate-200 bg-white", className)} {...rest}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-5">
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500 truncate">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ children, action, accent = "bg-brand-500" }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2 sm:px-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span className={cx("h-3.5 w-1 rounded-full", accent)} aria-hidden="true" />
        {children}
      </h2>
      {action}
    </div>
  );
}

export function SearchField({ value, onChange, placeholder, label }) {
  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label || placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-[border-color,box-shadow] focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// `dot` adds a small colour key (e.g. an order status colour) before the label
export function Chip({ active, onClick, children, count, dot }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-150 cursor-pointer",
        active ? "bg-navy-950 text-white shadow-[0_4px_12px_-4px_rgba(7,19,43,0.45)]" : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      {dot && <span className={cx("h-2 w-2 rounded-full", dot, active && "ring-2 ring-white/25")} aria-hidden="true" />}
      {children}
      {count !== undefined && (
        <span className={cx("tabular-nums text-xs", active ? "text-slate-300" : "text-slate-400")}>{count}</span>
      )}
    </button>
  );
}

export function ChipRow({ children }) {
  return <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0">{children}</div>;
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="relative grid rounded-xl bg-slate-100 p-1 sm:max-w-sm" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 rounded-lg bg-white shadow-[0_1px_3px_rgba(15,23,42,0.1)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${Math.max(0, options.findIndex((o) => o.value === value)) * 100}%)`,
        }}
      />
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cx(
              "relative z-10 flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer",
              active ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
            )}
          >
            {opt.label}
            {opt.count !== undefined && <span className={cx("tabular-nums text-xs", active ? "text-slate-500" : "text-slate-400")}>{opt.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({ icon: IconCmp, title, description, action, tone = "bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100" }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {IconCmp && (
        <div className={cx("mb-3 flex h-12 w-12 items-center justify-center rounded-2xl", tone)}>
          <IconCmp className="h-6 w-6" />
        </div>
      )}
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ className = "h-4 w-4" }) {
  return <span className={cx("inline-block shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin", className)} aria-hidden="true" />;
}

export function Field({ label, prefix, suffix, hint, className = "", inputClassName = "", ...inputProps }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white transition-[border-color,box-shadow] focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/10">
        {prefix && <span className="pl-3.5 text-sm text-slate-400">{prefix}</span>}
        <input
          id={id}
          {...inputProps}
          className={cx("h-full w-full min-w-0 bg-transparent px-3.5 text-base sm:text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400", prefix && "pl-1.5", inputClassName)}
        />
        {suffix && <span className="pr-3.5 text-sm text-slate-400">{suffix}</span>}
      </div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// Bottom sheet on phones, centred dialog from sm: up
// `hero` gives the header the navy landing-page surface (used for the catalogue)
export function Sheet({ open, onClose, title, subtitle, leading, footer, children, size = "md", fullHeightMobile = false, hero = false }) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center sm:p-6">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] vd-scrim" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx(
          "relative flex w-full flex-col overflow-hidden bg-white shadow-[0_32px_64px_-16px_rgba(15,23,42,0.35)] vd-sheet sm:rounded-2xl",
          fullHeightMobile ? "h-[100dvh] sm:h-auto sm:max-h-[86vh]" : "max-h-[92dvh] rounded-t-2xl sm:max-h-[86vh]",
          size === "lg" ? "sm:max-w-2xl" : "sm:max-w-md"
        )}
      >
        {!hero && <span className="vd-hairline absolute inset-x-0 top-0 z-10 hidden h-0.5 sm:block" aria-hidden="true" />}
        <div className={cx("relative flex shrink-0 items-center gap-3 overflow-hidden px-4 py-3 sm:px-5 sm:py-4", hero ? "vd-hero text-white" : "border-b border-slate-100")}>
          {hero && <span className="vd-blueprint absolute inset-0" aria-hidden="true" />}
          {leading}
          <div className="relative min-w-0 flex-1">
            <h2 id={titleId} className={cx("truncate text-base font-semibold", hero ? "text-white" : "text-slate-900")}>{title}</h2>
            {subtitle && <p className={cx("truncate text-sm", hero ? "text-slate-300" : "text-slate-500")}>{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cx(
              "relative -mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-[background-color,transform] duration-300 hover:rotate-90 cursor-pointer",
              hero ? "text-slate-300 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">{footer}</div>}
      </div>
    </div>
  );
}

// Eased count-up for headline figures (jumps straight to the value under reduced motion)
function useCountUp(value, duration = 900) {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(0);
  const currentRef = useRef(0);

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const from = currentRef.current;
    if (reduce || from === target) {
      currentRef.current = target;
      const raf = requestAnimationFrame(() => setDisplay(target));
      return () => cancelAnimationFrame(raf);
    }
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const next = Math.round(from + (target - from) * (1 - Math.pow(1 - t, 3)));
      currentRef.current = next;
      setDisplay(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return display;
}

export function CountUp({ value, format = (n) => n.toLocaleString("en-IN") }) {
  return <>{format(useCountUp(value))}</>;
}
