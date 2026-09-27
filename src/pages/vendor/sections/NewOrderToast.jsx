import { formatShortId } from "../../../utils/formatId";
import { BellIcon, CloseIcon } from "../ui/icons";
import { inr } from "../ui/format";

export default function NewOrderToast({ order, onView, onDismiss }) {
  if (!order) return null;
  const amount = Number(order.totalAmount || order.total || order.vendorItemsTotal || 0);
  const itemCount = Array.isArray(order.items) ? order.items.length : 1;

  return (
    <div key={order.id} className="fixed inset-x-3 top-3 z-50 sm:inset-x-auto sm:right-6 sm:top-6 sm:w-96 vd-toast" role="status" aria-live="polite">
      <div className="relative flex items-start gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_24px_48px_-16px_rgba(15,23,42,0.28)]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <BellIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">New order</p>
          <p className="mt-0.5 truncate text-sm text-slate-500">
            {formatShortId(order.id || order.orderNumber, "ORD")} · {inr(amount)} · {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
          <button type="button" onClick={onView} className="mt-2 text-sm font-semibold text-brand-700 hover:text-brand-600 cursor-pointer">
            View order
          </button>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-100" aria-hidden="true">
          <span className="vd-countdown block h-full bg-brand-500" />
        </span>
      </div>
    </div>
  );
}
