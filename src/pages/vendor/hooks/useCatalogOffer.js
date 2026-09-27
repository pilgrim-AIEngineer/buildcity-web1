import { useState } from "react";
import { withMrp, withDiscount, withPrice } from "../utils/pricing";

const DEFAULT_DISCOUNT = 10;
const EMPTY_OFFER = { mrp: "", discountPct: DEFAULT_DISCOUNT, price: "" };

/**
 * "Add from catalogue" sheet: open state, category/search filters, the selected master product,
 * its MRP ⇄ discount ⇄ price offer, stock, and submission (goes to Admin/DR review).
 */
export default function useCatalogOffer({ masterProducts, submitListing, showAlert }) {
  const [open, setOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [offer, setOffer] = useState(EMPTY_OFFER);
  const [stockQty, setStockQty] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const q = search.toLowerCase();
  const filteredProducts = masterProducts.filter(
    (mp) =>
      (categoryFilter === "ALL" || mp.categoryId === categoryFilter) &&
      [mp.name, mp.brand, mp.categoryName, mp.type].some((f) => (f || "").toLowerCase().includes(q))
  );

  const toggleSelect = (mp) => {
    if (selected?.id === mp.id) {
      setSelected(null);
      return;
    }
    setSelected(mp);
    setOffer(withMrp(EMPTY_OFFER, Number(mp.suggestedPrice) || 390));
    setStockQty(100);
  };

  const close = () => {
    setOpen(false);
    setSelected(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!selected || !offer.price) return;
    setIsSubmitting(true);
    try {
      await submitListing({
        masterProduct: selected,
        price: Number(offer.price),
        mrp: Number(offer.mrp) || Number(selected.suggestedPrice) || Number(offer.price),
        stockQty: Number(stockQty) || 0,
      });
      const name = selected.name;
      setSelected(null);
      showAlert({
        title: "Submitted for review",
        message: `${name} will go live once your district team approves it.\n\nPrice ₹${offer.price}${Number(offer.discountPct) > 0 ? ` (${offer.discountPct}% off)` : ""} · Stock ${stockQty}`,
        type: "success",
        buttonText: "Done",
      });
    } catch (err) {
      showAlert({ title: "Couldn't submit", message: err.message || "Please try again.", type: "warning" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    open,
    openSheet: () => setOpen(true),
    close,
    categoryFilter,
    setCategoryFilter,
    search,
    setSearch,
    filteredProducts,
    selectedId: selected?.id,
    toggleSelect,
    form: {
      mrp: offer.mrp,
      discountPct: offer.discountPct,
      sellingPrice: offer.price,
      stockQty,
      onMrpChange: (v) => setOffer((o) => withMrp(o, v)),
      onDiscountChange: (v) => setOffer((o) => withDiscount(o, v)),
      onSellingPriceChange: (v) => setOffer((o) => withPrice(o, v)),
      onStockChange: setStockQty,
    },
    submit,
    isSubmitting,
  };
}
