import { Button } from "../../ui/primitives";
import { PhoneIcon, ChevronDownIcon } from "../../ui/icons";
import { ORDER_STATUS, cx } from "../../ui/format";

const STATUS_OPTIONS = ["PENDING", "PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

// Call the customer + the labelled status dropdown (the only way to change an order's status)
export default function StatusControl({ orderId, status, phone, customerName, isUpdating, onStatusChange }) {
  const statusCfg = ORDER_STATUS[status] || ORDER_STATUS.PENDING;
  return (
    <div className="flex items-center gap-2">
      {phone && (
        <Button as="a" href={`tel:${phone}`} variant="success" className="w-11 shrink-0 !px-0" aria-label={`Call ${customerName}`}>
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
          value={status}
          onChange={(e) => onStatusChange(orderId, e.target.value)}
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
  );
}
