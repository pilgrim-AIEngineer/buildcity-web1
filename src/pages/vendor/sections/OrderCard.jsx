import { getOrderView } from "../orderView";
import { PhoneIcon, MapPinIcon, ChevronDownIcon } from "../ui/icons";
import { Button, StatusBadge, Spinner } from "../ui/primitives";
import { ORDER_STATUS, ORDER_STEPS, cx, inr } from "../ui/format";

const STATUS_OPTIONS = ["PENDING", "PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
const STEP_LABELS = ["Placed", "Processing", "Dispatched", "Delivered"];

// Where the order is on its way to site: done steps in green, the current one in its status colour
function ProgressTrack({ status }) {
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

export default function OrderCard({ order, index = 0, districtName, customerStats, isHighlighted, transition, isUpdating, onStatusChange }) {
  const view = getOrderView(order, districtName);
  const isTransitioning = transition && String(transition.orderId) === String(order.id);
  const statusCfg = ORDER_STATUS[view.status] || ORDER_STATUS.PENDING;

  return (
    <article
      id={`vendor-order-${order.id}`}
      data-order-id={order.id}
      style={{ "--i": index }}
      className={cx(
        "relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-[border-color,box-shadow] duration-300",
        isHighlighted
          ? "border-brand-500 ring-2 ring-brand-500/25 vd-locate"
          : "border-slate-200 hover:border-slate-300 hover:shadow-[0_12px_32px_-18px_rgba(15,23,42,0.22)]"
      )}
    >
      {/* Status colour down the leading edge */}
      <span className={cx("absolute inset-y-0 left-0 w-1 transition-colors duration-500", statusCfg.accent)} aria-hidden="true" />
      {isTransitioning && (
        <span className="absolute inset-x-0 top-0 h-0.5 overflow-hidden" aria-hidden="true">
          <span className="vd-indeterminate block h-full w-2/5 bg-gradient-to-r from-brand-500 to-amber-400" />
        </span>
      )}
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[15px] font-semibold text-slate-900">{view.customerName}</h3>
            {isHighlighted && (
              <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-semibold text-white">New</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            <span className="font-semibold text-brand-700">{view.shortId}</span>
            <span className="mx-1.5 text-slate-300">·</span>
            {view.placedAt}
          </p>
        </div>
        <StatusBadge status={view.status} />
      </div>

      {/* Address + buyer */}
      <div className="mt-3 flex items-start gap-2 px-4 text-sm text-slate-600">
        <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
        <p className="line-clamp-2">{view.address}</p>
      </div>
      {customerStats?.isRepeat && (
        <p className="mt-1.5 px-4 pl-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/15">
            Repeat customer · {customerStats.orderCount} orders
          </span>
        </p>
      )}

      {/* Items */}
      <ul className="mx-4 mt-3 divide-y divide-slate-100 border-y border-slate-100">
        {view.items.map((it, idx) => (
          <li key={idx} className="flex items-baseline justify-between gap-3 py-2 text-sm">
            <span className="min-w-0 truncate text-slate-800">
              {it.name}
              <span className="ml-1.5 text-slate-400">× {it.qty}</span>
            </span>
            <span className="shrink-0 tabular-nums text-slate-700">{inr(it.lineTotal)}</span>
          </li>
        ))}
        <li className="flex items-baseline justify-between gap-3 py-2 text-sm">
          <span className="text-slate-500">Delivery</span>
          <span className="shrink-0 tabular-nums text-slate-500">{view.deliveryFee > 0 ? inr(view.deliveryFee) : "Free"}</span>
        </li>
      </ul>

      <div className="flex items-baseline justify-between px-4 pt-3">
        <span className="text-sm text-slate-500">Total</span>
        <span className="text-lg font-semibold tabular-nums tracking-tight text-slate-900">{inr(view.grandTotal)}</span>
      </div>

      <div className="px-4 pt-4">
        <ProgressTrack status={isTransitioning ? transition.targetStatus : view.status} />
      </div>

      {/* Actions */}
      <div className="mt-auto px-4 pb-4 pt-3">
        {isTransitioning ? (
          <div className="flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-50 text-sm font-medium text-amber-800 ring-1 ring-inset ring-amber-200" role="status">
            <Spinner />
            Updating to {ORDER_STATUS[transition.targetStatus]?.label.toLowerCase() || transition.targetStatus}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {view.phone && (
              <Button as="a" href={`tel:${view.phone}`} variant="success" className="w-11 shrink-0 !px-0" aria-label={`Call ${view.customerName}`}>
                <PhoneIcon className="h-[18px] w-[18px]" />
              </Button>
            )}
            <label className={cx("relative flex-1", statusCfg.text)}>
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center gap-1.5 text-sm opacity-80">
                <span className={cx("h-2 w-2 rounded-full", statusCfg.dot)} aria-hidden="true" />
                Status
              </span>
              <select
                aria-label="Order status"
                disabled={isUpdating}
                value={view.status}
                onChange={(e) => onStatusChange(order.id, e.target.value)}
                className={cx(
                  "h-11 w-full appearance-none rounded-xl pl-[5rem] pr-9 text-sm font-semibold ring-1 ring-inset outline-none transition-colors duration-300 cursor-pointer disabled:opacity-50",
                  statusCfg.select
                )}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS[s].label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
            </label>
          </div>
        )}
      </div>
    </article>
  );
}
