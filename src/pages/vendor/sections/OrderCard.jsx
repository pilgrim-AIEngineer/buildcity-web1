import { getOrderView } from "../orderView";
import { ClockIcon, CrownIcon } from "../ui/icons";
import { StatusBadge, Spinner } from "../ui/primitives";
import { ORDER_STATUS, avatarTone, cx, inr } from "../ui/format";
import { formatPhone, initialsOf, ordinal } from "../ui/time";
import OrderAddress from "./order/OrderAddress";
import OrderItems from "./order/OrderItems";
import ProgressTrack from "./order/ProgressTrack";
import StatusControl from "./order/StatusControl";

/**
 * Order tile, tinted by status:
 *   status · when ─────────────── total
 *   customer (avatar, phone, loyalty)
 *   delivery site (2 lines, expandable, directions)
 *   items (qty × rate, folds past 4)
 *   items + delivery ········ payment
 *   progress · call + status dropdown
 */
export default function OrderCard({ order, index = 0, now, districtName, customerStats, isHighlighted, transition, isUpdating, onStatusChange }) {
  const view = getOrderView(order, districtName, now);
  const isTransitioning = transition && String(transition.orderId) === String(order.id);
  const statusCfg = ORDER_STATUS[view.status] || ORDER_STATUS.PENDING;
  const isOpen = ["PENDING", "PROCESSING", "OUT_FOR_DELIVERY"].includes(view.status);
  const orderCount = customerStats?.orderCount || 1;

  return (
    <article
      id={`vendor-order-${order.id}`}
      data-order-id={order.id}
      style={{ "--i": index }}
      className={cx(
        // Resting elevation so each tile reads as its own card; lifts a little more on hover
        "relative flex flex-col overflow-hidden rounded-2xl border shadow-[0_1px_2px_rgba(15,23,42,0.06),0_10px_28px_-14px_rgba(15,23,42,0.24)] transition-[border-color,box-shadow] duration-300",
        statusCfg.tile,
        isHighlighted
          ? "border-brand-500 ring-2 ring-brand-500/25 vd-locate"
          : "hover:shadow-[0_2px_4px_rgba(15,23,42,0.06),0_18px_40px_-16px_rgba(15,23,42,0.3)]"
      )}
    >
      {/* Status colour down the leading edge */}
      <span className={cx("absolute inset-y-0 left-0 w-1 transition-colors duration-500", statusCfg.accent)} aria-hidden="true" />
      {isTransitioning && (
        <span className="absolute inset-x-0 top-0 h-0.5 overflow-hidden" aria-hidden="true">
          <span className="vd-indeterminate block h-full w-2/5 bg-gradient-to-r from-brand-500 to-amber-400" />
        </span>
      )}

      {/* Header: status + when, amount on the right */}
      <header className="flex items-start justify-between gap-3 pl-5 pr-4 pt-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={view.status} />
            {isHighlighted && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-semibold text-white">New</span>}
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500" title={view.time.full}>
            <ClockIcon className="h-3.5 w-3.5 text-slate-400" />
            <span>{view.time.short}</span>
            {view.status === "PENDING" && view.ageMinutes >= 60 && <span className="font-medium text-brand-700">· waiting {view.age}</span>}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-semibold leading-none tracking-tight tabular-nums text-slate-900">{inr(view.grandTotal)}</p>
          <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">{view.payment.short}</p>
        </div>
      </header>

      <div className="space-y-3 pb-4 pl-5 pr-4 pt-3">
        {/* Customer */}
        <div className="flex items-center gap-3">
          <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-2 ring-white", avatarTone(view.customerName))} aria-hidden="true">
            {initialsOf(view.customerName)}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-semibold text-slate-900" title={view.customerName}>
              {view.customerName}
            </h3>
            <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
              <span className="truncate text-xs tabular-nums text-slate-500">{view.phone ? formatPhone(view.phone) : "No phone shared"}</span>
              {orderCount > 1 ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-1.5 py-px text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-600/15">
                  <CrownIcon className="h-3 w-3" />
                  {ordinal(orderCount)} order
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-px text-[11px] text-slate-500">New customer</span>
              )}
            </div>
          </div>
        </div>

        <OrderAddress party={view.party} />
        <OrderItems items={view.items} splitOf={view.splitOf} />

        {/* Money: breakdown on the left, what to collect on the right */}
        <div className="flex items-center justify-between gap-2 border-t border-dashed border-slate-200 pt-2.5">
          <p className="text-xs tabular-nums text-slate-500">
            Items {inr(view.itemsSubtotal)} <span className="text-slate-300">+</span> Delivery {view.deliveryFee > 0 ? inr(view.deliveryFee) : "free"}
          </p>
          {view.payment.collect && isOpen ? (
            <span className="shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-amber-800 ring-1 ring-inset ring-amber-600/20">
              Collect {inr(view.grandTotal)}
            </span>
          ) : (
            <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">{view.payment.label}</span>
          )}
        </div>
      </div>

      {/* Progress + actions */}
      <footer className={cx("mt-auto space-y-3 border-t pb-4 pl-5 pr-4 pt-3", statusCfg.band)}>
        <ProgressTrack status={isTransitioning ? transition.targetStatus : view.status} />
        {isTransitioning ? (
          <div className="flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-50 text-sm font-medium text-amber-800 ring-1 ring-inset ring-amber-200" role="status">
            <Spinner />
            Updating to {ORDER_STATUS[transition.targetStatus]?.label.toLowerCase() || transition.targetStatus}
          </div>
        ) : (
          <StatusControl
            orderId={order.id}
            status={view.status}
            phone={view.phone}
            customerName={view.customerName}
            isUpdating={isUpdating}
            onStatusChange={onStatusChange}
          />
        )}
      </footer>
    </article>
  );
}
