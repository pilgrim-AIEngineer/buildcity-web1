import { formatShortId, formatDateTimeIST } from "../../utils/formatId";

const itemQty = (it) => Number(it.quantity || it.qty || it.count || 1);

// Priced line amount, or 0 when the item carries no usable price
const pricedLine = (it) => {
  const rawPrice = it.price ?? it.unitPrice ?? it.priceAtPurchase ?? it.sellingPrice ?? it.rate;
  if (rawPrice !== undefined && rawPrice !== null && !isNaN(Number(rawPrice)) && Number(rawPrice) > 0) {
    return Number(rawPrice) * itemQty(it);
  }
  if (it.totalPrice || it.total || it.amount) {
    return Number(it.totalPrice || it.total || it.amount) || 0;
  }
  return 0;
};

// Normalises the many order payload shapes into what an order card renders
export function getOrderView(ord, districtName) {
  const rawAddr = ord.address;
  const isObj = typeof rawAddr === "object" && rawAddr !== null;
  const isStr = typeof rawAddr === "string" && rawAddr.trim().length > 0;

  const customerName =
    (isObj && (rawAddr.fullName || rawAddr.name)) ||
    ord.customer?.name ||
    (typeof ord.customer === "string" ? ord.customer : "Customer");
  const phone = (isObj && rawAddr.phone) || ord.customer?.phone || ord.phone || "";
  const city = isObj ? rawAddr.city : ord.districtName || ord.regionName || "";
  let street = isObj ? rawAddr.street || rawAddr.line || rawAddr.address : isStr ? rawAddr : null;
  if (!street) street = `Site delivery location (${city || districtName})`;

  const rawItems = Array.isArray(ord.items) ? ord.items : [];
  const deliveryFee = Number(ord.deliveryCharge ?? ord.deliveryFee ?? ord.shippingFee ?? ord.deliveryAmount ?? 0);

  let itemsSubtotal = rawItems.reduce((sum, it) => sum + pricedLine(it), 0);
  if (itemsSubtotal === 0) {
    itemsSubtotal = Number(ord.vendorItemsTotal || ord.totalAmount || ord.total || 0);
  }
  const rawTotal = Number(ord.totalAmount || ord.total || itemsSubtotal);
  const grandTotal = rawTotal > itemsSubtotal && rawTotal >= itemsSubtotal + deliveryFee ? rawTotal : itemsSubtotal + deliveryFee;

  const items = rawItems.map((it) => {
    let lineTotal = pricedLine(it);
    if (!lineTotal && itemsSubtotal > 0 && rawItems.length > 0) {
      lineTotal = Math.round(itemsSubtotal / rawItems.length);
    }
    return { name: it.productName || it.name || "Material", qty: itemQty(it), lineTotal };
  });

  return {
    shortId: formatShortId(ord.id || ord.orderNumber, "ORD"),
    placedAt: formatDateTimeIST(ord.createdAt || ord.date),
    status: (ord.status || "PENDING").toUpperCase(),
    customerName,
    phone,
    address: `${street}${city ? `, ${city}` : ""}`,
    items,
    itemsSubtotal,
    deliveryFee,
    grandTotal,
  };
}
