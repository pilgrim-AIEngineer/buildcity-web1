import { useMemo, useState } from "react";
import { resolveCategoryBubbleImage } from "../utils/productImage";

const STATIC_CATEGORIES = [
  { id: "Cement", name: "Cement", img: "/categories/cement.png" },
  { id: "Steel", name: "Steel", img: "/categories/steel.png" },
  { id: "Rebars", name: "Rebars", img: "/categories/rebars.png" },
  { id: "Crushed Stone", name: "Crushed Stone", img: "/categories/crushed_stone.png" },
  { id: "Tiles", name: "Tiles", img: "/categories/tiles.png" },
  { id: "Plumbing", name: "Plumbing", img: "/categories/plumbing.png" },
  { id: "Paints", name: "Paints", img: "/categories/paints.png" },
];

/** This vendor's listings (flexible DB match), the category list, and the Products tab filters. */
export default function useVendorProducts({ products, categories, vendorId, vendor, user, shopName, ownerName }) {
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const vendorProducts = useMemo(() => {
    const curShop = shopName.toLowerCase().trim();
    const curOwner = ownerName.toLowerCase().trim();
    return (products || []).filter((p) => {
      if (!p) return false;
      const matchesId = p.vendorId && (p.vendorId === vendorId || p.vendorId === vendor.id || p.vendorId === user?.id);
      const pShop = (p.vendorName || p.vendor?.shopName || "").toLowerCase().trim();
      const matchesShop = curShop && pShop && (pShop.includes(curShop) || curShop.includes(pShop));
      const matchesOwner = curOwner && p.vendor?.ownerName && p.vendor.ownerName.toLowerCase().includes(curOwner);
      return matchesId || matchesShop || matchesOwner;
    });
  }, [products, vendorId, vendor.id, user?.id, shopName, ownerName]);

  const allCategories = useMemo(() => {
    const map = new Map();
    STATIC_CATEGORIES.forEach((c) => map.set(c.name.toLowerCase(), c));
    (categories || []).forEach((c) => {
      const key = (c.name || "").toLowerCase();
      if (!map.has(key)) map.set(key, { id: c.id, name: c.name, img: resolveCategoryBubbleImage(c.name) });
    });
    return Array.from(map.values());
  }, [categories]);

  const q = search.toLowerCase();
  const displayedProducts = vendorProducts.filter((p) => {
    if (categoryFilter !== "ALL") {
      const catName = (p.categoryName || "").toLowerCase();
      const target = categoryFilter.toLowerCase();
      if (!(p.categoryId === categoryFilter || catName === target || catName.includes(target))) return false;
    }
    return !q || [p.name, p.brand, p.categoryName, p.grade].some((f) => (f || "").toLowerCase().includes(q));
  });

  return { vendorProducts, allCategories, displayedProducts, categoryFilter, setCategoryFilter, search, setSearch };
}
