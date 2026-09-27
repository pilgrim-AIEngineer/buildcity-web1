import { formatOrderTime, formatAge } from "./ui/time";

export const itemQty = (it) => Number(it.quantity || it.qty || it.count || 1);

const unitPriceOf = (it) => {
  const raw = it.price ?? it.unitPrice ?? it.priceAtPurchase ?? it.sellingPrice ?? it.rate;
  return raw !== undefined && raw !== null && !isNaN(Number(raw)) && Number(raw) > 0 ? Number(raw) : 0;
};

// Priced line amount, or 0 when the item carries no usable price
export const pricedLine = (it) => {
  const unit = unitPriceOf(it);
  if (unit > 0) return unit * itemQty(it);
  return Number(it.totalPrice || it.total || it.amount) || 0;
};

// Recipient + delivery site (address object, legacy string address, or customer fallback)
export function getOrderParty(ord, districtName = "") {
  const raw = ord.address;
  const isObj = typeof raw === "object" && raw !== null;
  const isStr = typeof raw === "string" && raw.trim().length > 0;
  const name = String(
    (isObj && (raw.fullName || raw.name)) || ord.customer?.name || (typeof ord.customer === "string" ? ord.customer : "") || "Customer"
  ).trim();
  const phone = String((isObj && raw.phone) || ord.customer?.phone || ord.phone || "").trim();
  const street = String((isObj ? raw.street || raw.line || raw.address : isStr ? raw : "") || "").trim();
  const city = String((isObj ? raw.city || raw.region?.name : "") || ord.districtName || ord.regionName || districtName || "").trim();
  const pincode = String((isObj && raw.pincode) || "").trim();
  return { name, phone, street, city, pincode };
}

// Key used to spot repeat customers (phone first, then name)
export const customerKey = (ord) => {
  const { name, phone } = getOrderParty(ord);
  return phone || (name === "Customer" ? "" : name.toLowerCase());
};

export const mapsUrl = ({ street, city, pincode }) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([street, city, pincode].filter(Boolean).join(", "))}`;

const paymentOf = (mode) => {
  const m = String(mode || "COD").toUpperCase();
  return m === "COD" || m.includes("CASH") ? { label: "Cash on delivery", short: "COD", collect: true } : { label: "Paid online", short: "Prepaid", collect: false };
};

// Normalises the many order payload shapes into what an order card renders
export function getOrderView(ord, districtName, now = Date.now()) {
  const party = getOrderParty(ord, districtName);
  const rawItems = Array.isArray(ord.items) ? ord.items : [];
  const deliveryFee = Number(ord.deliveryCharge ?? ord.deliveryFee ?? ord.shippingFee ?? ord.deliveryAmount ?? 0) || 0;

  let itemsSubtotal = rawItems.reduce((sum, it) => sum + pricedLine(it), 0);
  if (itemsSubtotal === 0) {
    itemsSubtotal = Number(ord.vendorItemsTotal || ord.totalAmount || ord.total || 0);
  }
  const rawTotal = Number(ord.totalAmount || ord.total || itemsSubtotal);
  const grandTotal = rawTotal > itemsSubtotal && rawTotal >= itemsSubtotal + deliveryFee ? rawTotal : itemsSubtotal + deliveryFee;

  const items = rawItems.map((it, idx) => {
    let lineTotal = pricedLine(it);
    if (!lineTotal && itemsSubtotal > 0 && rawItems.length > 0) {
      lineTotal = Math.round(itemsSubtotal / rawItems.length);
    }
    return { key: it.id || idx, name: it.productName || it.name || "Material", qty: itemQty(it), unitPrice: unitPriceOf(it), lineTotal };
  });

  const placed = ord.createdAt || ord.date;
  const allItemsCount = Number(ord.allOrderItemsCount || ord.totalOrderItemsCount || 0);

  return {
    status: (ord.status || "PENDING").toUpperCase(),
    customerName: party.name,
    phone: party.phone,
    party,
    address: [party.street, party.city].filter(Boolean).join(", "),
    time: formatOrderTime(placed, now),
    ageMinutes: placed ? (now - new Date(placed).getTime()) / 60000 : 0,
    age: formatAge(placed, now),
    payment: paymentOf(ord.paymentMode),
    items,
    // Other shops supplied the rest of this customer's order
    splitOf: allItemsCount > items.length ? allItemsCount : 0,
    itemsSubtotal,
    deliveryFee,
    grandTotal,
  };
}
