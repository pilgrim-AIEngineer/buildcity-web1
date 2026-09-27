// MRP ⇄ discount % ⇄ selling price sync, shared by "Add from catalog" and "Edit listing" forms.
// Each helper takes the current { mrp, discountPct, price } and returns the next one.

export const discountFor = (mrp, price) => {
  const m = Number(mrp) || 0;
  const p = Number(price) || 0;
  return m > 0 && p > 0 && p <= m ? Math.round(((m - p) / m) * 100) : 0;
};

const priceFor = (mrp, discountPct) => Math.round((Number(mrp) || 0) * (1 - (Number(discountPct) || 0) / 100));

export const withMrp = (offer, mrp) =>
  Number(mrp) > 0 ? { ...offer, mrp, price: priceFor(mrp, offer.discountPct) } : { ...offer, mrp };

export const withDiscount = (offer, discountPct) =>
  Number(offer.mrp) > 0 ? { ...offer, discountPct, price: priceFor(offer.mrp, discountPct) } : { ...offer, discountPct };

export const withPrice = (offer, price) => ({ ...offer, price, discountPct: discountFor(offer.mrp, price) });
