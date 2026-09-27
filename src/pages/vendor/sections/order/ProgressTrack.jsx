import { ORDER_STATUS, ORDER_STEPS, cx } from "../../ui/format";

const STEP_LABELS = ["Placed", "Processing", "Dispatched", "Delivered"];

// Where the order is on its way to site: done steps in green, the current one in its status colour
export default function ProgressTrack({ status }) {
  const step = ORDER_STEPS.indexOf(status);
  if (step < 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="h-1 flex-1 rounded-full bg-slate-100" />
        Order cancelled
        <span className="h-1 flex-1 rounded-full bg-slate-100" />
      </div>
    );
  }
  const done = step === ORDER_STEPS.length - 1;
  return (
    <div role="img" aria-label={`Progress: ${STEP_LABELS[step]}`}>
      <div className="grid grid-cols-4 gap-1">
        {STEP_LABELS.map((l, i) => (
          <span
            key={l}
            className={cx(
              "h-1 rounded-full transition-colors duration-500",
              i < step || (done && i === step) ? "bg-emerald-500" : i === step ? ORDER_STATUS[status].accent : "bg-slate-200/80"
            )}
          />
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-4 gap-1 text-[11px]">
        {STEP_LABELS.map((l, i) => (
          <span key={l} className={cx("truncate", i === step ? "font-semibold text-slate-900" : i < step ? "text-emerald-700" : "text-slate-400")}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
