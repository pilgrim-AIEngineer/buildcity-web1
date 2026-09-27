import { useState } from "react";
import { withMrp, withDiscount, withPrice, discountFor } from "../utils/pricing";

/** "Edit listing" sheet: the listing being edited, MRP ⇄ discount ⇄ price sync, stock, and save. */
export default function useListingEditor({ updateVendorProductListing, showAlert }) {
  const [editingProduct, setEditingProduct] = useState(null);

  const open = (p) => {
    const price = Number(p.price) || 100;
    const mrp = Number(p.mrp || p.masterProduct?.suggestedPrice || Math.round(price * 1.2));
    setEditingProduct({ ...p, mrp, price, discountPct: mrp > price ? discountFor(mrp, price) : 0, stockQty: p.stockQty !== undefined ? p.stockQty : 100 });
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
      await updateVendorProductListing(prod.id, { price: Number(prod.price), mrp: Number(prod.mrp), stockQty: Number(prod.stockQty) });
    } catch (err) {
      console.warn("Background update listing note:", err.message);
    }
  };

  return {
    editingProduct,
    open,
    close: () => setEditingProduct(null),
    save,
    onMrpChange: (v) => setEditingProduct((p) => withMrp(p, v)),
    onDiscountChange: (v) => setEditingProduct((p) => withDiscount(p, v)),
    onPriceChange: (v) => setEditingProduct((p) => withPrice(p, v)),
    onStockChange: (v) => setEditingProduct((p) => ({ ...p, stockQty: v })),
  };
}
