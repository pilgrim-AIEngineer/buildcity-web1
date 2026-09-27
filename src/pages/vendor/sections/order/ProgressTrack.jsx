import { ORDER_STATUS, ORDER_STEPS, cx } from "../../ui/format";

const STEP_LABELS = ["Placed", "Processing", "Dispatched", "Delivered"];

// Slim, label-free progress bar: done steps green, the current one in its status colour.
// The step name stays available to screen readers and on hover.
export default function ProgressTrack({ status }) {
  const step = ORDER_STEPS.indexOf(status);
  if (step < 0) return null;
  const done = step === ORDER_STEPS.length - 1;
  return (
    <div role="img" aria-label={`Progress: ${STEP_LABELS[step]}`} title={`${STEP_LABELS[step]} · step ${step + 1} of 4`} className="grid grid-cols-4 gap-1">
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
  );
}
