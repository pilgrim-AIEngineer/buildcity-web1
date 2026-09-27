import { ORDER_STATUS, ORDER_STEPS, cx } from "../../ui/format";

const STEP_LABELS = ["Placed", "Processing", "Dispatched", "Delivered"];

// Hairline stepper: a 2px track filled in the order's status colour up to the current step,
// with four nodes — reached steps as solid dots, the current one haloed, the rest hollow.
export default function ProgressTrack({ status }) {
  const step = ORDER_STEPS.indexOf(status);
  if (step < 0) return null;
  const cfg = ORDER_STATUS[status];
  return (
    <div role="img" aria-label={`Progress: ${STEP_LABELS[step]}`} title={`${STEP_LABELS[step]} · step ${step + 1} of 4`} className="px-1.5 py-1">
      <div className="relative h-2.5">
        <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-slate-100" />
        <span
          className={cx("absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition-[width] duration-700", cfg.accent)}
          style={{ width: `${(step / (STEP_LABELS.length - 1)) * 100}%` }}
        />
        {STEP_LABELS.map((l, i) => (
          <span
            key={l}
            style={{ left: `${(i / (STEP_LABELS.length - 1)) * 100}%` }}
            className={cx(
              "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500",
              i === step
                ? cx("h-2.5 w-2.5 ring-4", cfg.accent, cfg.halo)
                : i < step
                ? cx("h-1.5 w-1.5", cfg.accent)
                : "h-2 w-2 bg-white ring-[1.5px] ring-inset ring-slate-200"
            )}
          />
        ))}
      </div>
    </div>
  );
}
