import { getOrderParty } from "../orderView";
import { BellIcon, CloseIcon } from "../ui/icons";
import { inr } from "../ui/format";

export default function NewOrderToast({ order, onView, onDismiss }) {
  if (!order) return null;
  const amount = Number(order.totalAmount || order.total || order.vendorItemsTotal || 0);
  const itemCount = Array.isArray(order.items) ? order.items.length : 1;

  return (
    <div key={order.id} className="fixed inset-x-3 top-3 z-50 sm:inset-x-auto sm:right-6 sm:top-6 sm:w-96 vd-toast" role="status" aria-live="polite">
      <div className="vd-hero relative flex items-start gap-3 overflow-hidden rounded-2xl border border-amber-300/30 p-4 text-white shadow-[0_24px_48px_-16px_rgba(7,19,43,0.55)]">
        <span className="vd-blueprint absolute inset-0" aria-hidden="true" />
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-navy-950">
          <BellIcon className="h-5 w-5" />
        </span>
        <div className="relative min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-200">New order</p>
          <p className="mt-0.5 truncate text-sm text-slate-300">
            {getOrderParty(order).name} · {inr(amount)} · {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
          <button type="button" onClick={onView} className="mt-2.5 inline-flex h-8 items-center rounded-lg bg-amber-400 px-3 text-sm font-semibold text-navy-950 transition-colors hover:bg-amber-300 cursor-pointer">
            View order
          </button>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="relative -mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10" aria-hidden="true">
          <span className="vd-countdown vd-hairline block h-full" />
        </span>
      </div>
    </div>
  );
}
