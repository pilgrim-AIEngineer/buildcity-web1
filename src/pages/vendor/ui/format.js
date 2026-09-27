export const cx = (...classes) => classes.filter(Boolean).join(" ");

export const inr = (value) => `₹${(Number(value) || 0).toLocaleString("en-IN")}`;

// Order lifecycle: display label and badge tone
export const ORDER_STATUS = {
// One accent: orange marks what needs the vendor; everything else stays in ink
  PENDING: { label: "Pending", tone: "bg-brand-50 text-brand-700 ring-brand-600/20", dot: "bg-brand-500" },
  PROCESSING: { label: "Processing", tone: "bg-slate-100 text-slate-700 ring-slate-500/10", dot: "bg-slate-600" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", tone: "bg-slate-100 text-slate-800 ring-slate-500/10", dot: "bg-slate-900" },
  DELIVERED: { label: "Delivered", tone: "bg-white text-slate-600 ring-slate-200", dot: "bg-slate-400" },
  CANCELLED: { label: "Cancelled", tone: "bg-slate-50 text-slate-400 ring-slate-200", dot: "bg-slate-300" },
};

// Compact Indian notation for tight spaces: 1,67,500 -> 1.68 L
export const inrCompact = (value) => {
  const v = Number(value) || 0;
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2).replace(/\.?0+$/, "")} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(2).replace(/\.?0+$/, "")} L`;
  return inr(v);
};

// Order delivery steps shown on the progress track
export const ORDER_STEPS = ["PENDING", "PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED"];
