export const cx = (...classes) => classes.filter(Boolean).join(" ");

export const inr = (value) => `₹${(Number(value) || 0).toLocaleString("en-IN")}`;

// Order lifecycle: one colour per status, used by badges, filter dots, card accents and tint,
// the status select and the progress track. Pending keeps the brand orange ("needs you").
export const ORDER_STATUS = {
  PENDING: {
    label: "Pending",
    tone: "bg-brand-50 text-brand-700 ring-brand-600/20",
    dot: "bg-brand-500",
    accent: "bg-brand-500",
    text: "text-brand-800",
    select: "bg-brand-50/70 text-brand-800 ring-brand-200 hover:bg-brand-50",
    tile: "bg-gradient-to-b from-brand-50 via-white to-white border-brand-300/70",
    band: "bg-brand-50/70 border-brand-100",
  },
  PROCESSING: {
    label: "Processing",
    tone: "bg-sky-50 text-sky-700 ring-sky-600/20",
    dot: "bg-sky-500",
    accent: "bg-sky-500",
    text: "text-sky-800",
    select: "bg-sky-50/70 text-sky-800 ring-sky-200 hover:bg-sky-50",
    tile: "bg-gradient-to-b from-sky-50 via-white to-white border-sky-300/70",
    band: "bg-sky-50/70 border-sky-100",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for delivery",
    tone: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
    dot: "bg-indigo-500",
    accent: "bg-indigo-500",
    text: "text-indigo-800",
    select: "bg-indigo-50/70 text-indigo-800 ring-indigo-200 hover:bg-indigo-50",
    tile: "bg-gradient-to-b from-indigo-50 via-white to-white border-indigo-300/70",
    band: "bg-indigo-50/70 border-indigo-100",
  },
  DELIVERED: {
    label: "Delivered",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
    accent: "bg-emerald-500",
    text: "text-emerald-800",
    select: "bg-emerald-50/70 text-emerald-800 ring-emerald-200 hover:bg-emerald-50",
    tile: "bg-gradient-to-b from-emerald-50/70 via-white to-white border-emerald-300/60",
    band: "bg-emerald-50/60 border-emerald-100",
  },
  CANCELLED: {
    label: "Cancelled",
    tone: "bg-rose-50 text-rose-600 ring-rose-600/15",
    dot: "bg-rose-400",
    accent: "bg-rose-300",
    text: "text-rose-700",
    select: "bg-rose-50/60 text-rose-700 ring-rose-200 hover:bg-rose-50",
    tile: "bg-gradient-to-b from-slate-100/80 via-white to-white border-slate-300/80",
    band: "bg-slate-50 border-slate-200/70",
  },
};

// Stable tinted avatar for a customer name (same person, same colour)
const AVATAR_TONES = [
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-800",
  "bg-emerald-100 text-emerald-700",
  "bg-indigo-100 text-indigo-700",
  "bg-rose-100 text-rose-700",
  "bg-brand-100 text-brand-700",
];
export const avatarTone = (name = "") => {
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
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
