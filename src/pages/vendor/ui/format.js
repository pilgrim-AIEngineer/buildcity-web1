export const cx = (...classes) => classes.filter(Boolean).join(" ");

export const inr = (value) => `₹${(Number(value) || 0).toLocaleString("en-IN")}`;

// Order lifecycle: display label and badge tone
export const ORDER_STATUS = {
  PENDING: { label: "Pending", tone: "bg-amber-50 text-amber-800 ring-amber-600/20", dot: "bg-amber-500" },
  PROCESSING: { label: "Processing", tone: "bg-sky-50 text-sky-800 ring-sky-600/20", dot: "bg-sky-500" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", tone: "bg-indigo-50 text-indigo-800 ring-indigo-600/20", dot: "bg-indigo-500" },
  DELIVERED: { label: "Delivered", tone: "bg-emerald-50 text-emerald-800 ring-emerald-600/20", dot: "bg-emerald-500" },
  CANCELLED: { label: "Cancelled", tone: "bg-slate-100 text-slate-600 ring-slate-500/20", dot: "bg-slate-400" },
};
