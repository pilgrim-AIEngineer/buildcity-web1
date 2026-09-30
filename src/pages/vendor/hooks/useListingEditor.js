import { useState } from "react";
import { withMrp, withDiscount, withPrice, discountFor } from "../utils/pricing";

/** "Edit listing" sheet: the listing being edited, MRP ⇄ discount ⇄ price sync, stock, and save. */
export default function useListingEditor({ updateVendorProductListing, showAlert }) {
  const [editingProduct, setEditingProduct] = useState(null);

  const open = (p) => {
    const price = Number(p.price) || 100;
    const mrp = Number(p.mrp || p.masterProduct?.mrp || p.masterProduct?.suggestedPrice || Math.round(price * 1.2));
    let customPacks = p.customPacks || p.custom_packs || null;
    if (typeof customPacks === "string") {
      try {
        customPacks = JSON.parse(customPacks);
      } catch {}
    }
    setEditingProduct({
      ...p,
      mrp,
      price,
      discountPct: mrp > price ? discountFor(mrp, price) : 0,
      stockQty: p.stockQty !== undefined ? p.stockQty : 100,
      customPacks: Array.isArray(customPacks) ? customPacks : null,
    });
  };

  // Close first and confirm, then save in the background
  const save = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    const prod = { ...editingProduct };
    setEditingProduct(null);
    showAlert({
      title: "Listing updated",
      message: `Customers now see ₹${prod.price}${Number(prod.discountPct) > 0 ? ` (${prod.discountPct}% off)` : ""}.`,
      type: "success",
      buttonText: "Done",
    });
    try {
      const unitMrp = Number(prod.mrp) || Math.round((Number(prod.price) || 0) * 1.2);
      let sanitizedPacks = null;
      if (Array.isArray(prod.customPacks) && prod.customPacks.length > 0) {
        sanitizedPacks = prod.customPacks.map((pk) => {
          const qty = Number(pk.qty) || 1;
          const packMrp = Math.round(unitMrp * qty);
          const packPrice = Number(pk.price) > 0 ? Number(pk.price) : Math.round((Number(prod.price) || 100) * qty);
          return {
            label: pk.label,
            qty,
            price: packPrice,
            mrp: packMrp,
            stock: pk.stock !== undefined && pk.stock !== "" ? Number(pk.stock) : Number(prod.stockQty || 100),
          };
        });
      }
      await updateVendorProductListing(prod.id, {
        price: Number(prod.price),
        mrp: Number(prod.mrp),
        stockQty: Number(prod.stockQty),
        customPacks: sanitizedPacks,
      });
    } catch (err) {
      console.warn("Background update listing note:", err.message);
    }
  };

  return {
    editingProduct,
    open,
    close: () => setEditingProduct(null),
    save,
    onMrpChange: (v) =>
      setEditingProduct((p) => {
        const updated = withMrp(p, v);
        if (Array.isArray(updated.customPacks) && updated.customPacks.length > 0) {
          const newUnitMrp = Number(updated.mrp) || Math.round((Number(updated.price) || 0) * 1.2);
          updated.customPacks = updated.customPacks.map((cp) => ({
            ...cp,
            mrp: Math.round(newUnitMrp * (Number(cp.qty) || 1)),
          }));
        }
        return updated;
      }),
    onDiscountChange: (v) => setEditingProduct((p) => withDiscount(p, v)),
    onPriceChange: (v) =>
      setEditingProduct((p) => {
        const updated = withPrice(p, v);
        if (Array.isArray(updated.customPacks) && updated.customPacks.length > 0) {
          const newPrice = Number(updated.price) || 0;
          updated.customPacks = updated.customPacks.map((cp) => {
            if (cp.qty === 1) {
              return { ...cp, price: newPrice };
            }
            return cp;
          });
        }
        return updated;
      }),
    onStockChange: (v) => setEditingProduct((p) => ({ ...p, stockQty: v })),
    onCustomPacksChange: (packs) => setEditingProduct((p) => ({ ...p, customPacks: packs })),
  };
}
