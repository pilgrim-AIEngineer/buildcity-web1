// Glanceable time / people formatting for order tiles (all times in IST)

const IST = "Asia/Kolkata";
const istDayKey = (d) => d.toLocaleDateString("en-CA", { timeZone: IST });

const formatFullIST = (d) =>
  d.toLocaleString("en-IN", {
    timeZone: IST,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

// "Just now" · "12m ago" · "2:45 PM" · "Yesterday" · "12 Sep" · "12 Sep 25", plus the full timestamp for a tooltip
export const formatOrderTime = (value, now = Date.now()) => {
  const d = value ? new Date(value) : null;
  if (!d || isNaN(d.getTime())) return { short: "—", full: "" };

  const full = formatFullIST(d);
  const diffMin = Math.floor((now - d.getTime()) / 60000);
  if (diffMin < 1) return { short: "Just now", full };
  if (diffMin < 60) return { short: `${diffMin}m ago`, full };

  const today = istDayKey(new Date(now));
  const day = istDayKey(d);
  if (day === today) {
    return { short: d.toLocaleTimeString("en-IN", { timeZone: IST, hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase(), full };
  }
  if (day === istDayKey(new Date(now - 86400000))) return { short: "Yesterday", full };

  const sameYear = day.slice(0, 4) === today.slice(0, 4);
  return { short: d.toLocaleDateString("en-IN", { timeZone: IST, day: "numeric", month: "short", ...(sameYear ? {} : { year: "2-digit" }) }), full };
};

// How long an order has been open: "8m" · "3h" · "2d"
export const formatAge = (value, now = Date.now()) => {
  const t = value ? new Date(value).getTime() : NaN;
  if (isNaN(t)) return "";
  const min = Math.max(0, Math.floor((now - t) / 60000));
  if (min < 60) return `${min}m`;
  if (min < 1440) return `${Math.floor(min / 60)}h`;
  return `${Math.floor(min / 1440)}d`;
};

export const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

