import { getOrderView } from "../orderView";
import { PhoneIcon, MapPinIcon, ChevronDownIcon } from "../ui/icons";
import { Button, StatusBadge, Spinner } from "../ui/primitives";
import { ORDER_STATUS, cx, inr } from "../ui/format";

const STATUS_OPTIONS = ["PENDING", "PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

export default function OrderCard({ order, districtName, customerStats, isHighlighted, transition, isUpdating, onStatusChange }) {
  const view = getOrderView(order, districtName);
  const isTransitioning = transition && String(transition.orderId) === String(order.id);

  return (
    <article
      id={`vendor-order-${order.id}`}
      data-order-id={order.id}
      className={cx(
        "flex flex-col rounded-2xl border bg-white transition-shadow duration-300",
        isHighlighted ? "border-brand-500 ring-2 ring-brand-500/25" : "border-slate-200"
      )}
    >
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
            <span className="font-medium text-slate-600">{view.shortId}</span>
            <span className="mx-1.5 text-slate-300">·</span>
            {view.placedAt}
          </p>
        </div>
        <StatusBadge status={view.status} />
      </div>

      {/* Address + buyer */}
      <div className="mt-3 flex items-start gap-2 px-4 text-sm text-slate-600">
        <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <p className="line-clamp-2">{view.address}</p>
      </div>
      {customerStats?.isRepeat && (
        <p className="mt-1.5 px-4 pl-10 text-xs font-medium text-slate-500">Repeat customer · {customerStats.orderCount} orders</p>
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
        <span className="text-base font-semibold tabular-nums text-slate-900">{inr(view.grandTotal)}</span>
      </div>

      {/* Actions */}
      <div className="mt-auto px-4 pb-4 pt-3">
        {isTransitioning ? (
          <div className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-50 text-sm font-medium text-slate-600" role="status">
            <Spinner />
            Updating to {ORDER_STATUS[transition.targetStatus]?.label.toLowerCase() || transition.targetStatus}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {view.phone && (
              <Button as="a" href={`tel:${view.phone}`} variant="secondary" className="w-11 shrink-0 !px-0" aria-label={`Call ${view.customerName}`}>
                <PhoneIcon className="h-[18px] w-[18px]" />
              </Button>
            )}
            <label className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-slate-500">Status</span>
              <select
                aria-label="Order status"
                disabled={isUpdating}
                value={view.status}
                onChange={(e) => onStatusChange(order.id, e.target.value)}
                className="h-11 w-full appearance-none rounded-xl bg-white pl-[4.25rem] pr-9 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-slate-200 outline-none transition-colors hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS[s].label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </label>
          </div>
        )}
      </div>
    </article>
  );
}
