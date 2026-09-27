import { useCallback, useMemo } from "react";

const digits = (s) => (s ? String(s).replace(/\D/g, "") : "");

const GENERIC_STORE_NAMES = ["distributor store", "vendor owner", "vendor partner", "district vendor", "vendor", "store", "shop"];
const isGenericStoreName = (str = "") => {
  const s = String(str || "").trim().toLowerCase();
  return !s || GENERIC_STORE_NAMES.includes(s);
};

// Resolves the logged-in vendor against the DB vendors list, with display fallbacks
export default function useVendorIdentity(user, vendors) {
  const vendor = useMemo(() => {
    const userPhone = digits(user?.phone);
    const found = (vendors || []).find((v) => {
      const phoneMatches = userPhone && (digits(v.phone) === userPhone || digits(v.user?.phone) === userPhone);
      const idMatches =
        (user?.vendorInfo?.id && (v.id === user.vendorInfo.id || v.userId === user.vendorInfo.id)) ||
        (user?.vendorId && (v.id === user.vendorId || v.userId === user.vendorId)) ||
        (user?.id && (v.id === user.id || v.userId === user.id));
      return phoneMatches || idMatches;
    });
    return found || user?.vendorInfo || {};
  }, [vendors, user]);

  const shopName = vendor.shopName || user?.vendorInfo?.shopName || user?.shopName || user?.name || "Distributor Store";
  const ownerName = vendor.ownerName || user?.vendorInfo?.ownerName || user?.name || "Vendor Owner";
  const vendorPhone = vendor.phone || user?.phone || user?.vendorInfo?.phone || "9876543210";
  const districtName =
    vendor.region?.name || vendor.regionName || vendor.districtName || user?.vendorInfo?.region?.name || user?.vendorInfo?.regionName || "Mirzapur";
  const vendorId = vendor.id || user?.vendorInfo?.id || user?.vendorId || user?.id || (user?.phone ? `v-${user.phone}` : `v-${Date.now()}`);

  // Does an order item belong to this vendor? (id, phone, then shop / owner name heuristics)
  const isItemForThisVendor = useCallback((it) => {
    if (!it) return false;
    const itVendorId = it.vendorId || it.vendor?.id;
    const itVendorName = String(it.vendorName || it.vendor?.shopName || "").trim();
    const curShop = String(shopName || "").trim();
    const curOwner = String(ownerName || "").trim();
    const curPhone = digits(user?.phone || vendor.phone);
    const itPhone = digits(it.vendor?.phone);

    const matchesId = Boolean(
      itVendorId &&
        (itVendorId === vendorId ||
          itVendorId === vendor.id ||
          (user?.id && itVendorId === user.id) ||
          (user?.vendorInfo?.id && itVendorId === user.vendorInfo.id) ||
          (vendor.userId && itVendorId === vendor.userId))
    );
    const matchesPhone = Boolean(curPhone && itPhone && curPhone.length >= 8 && itPhone.length >= 8 && curPhone.slice(-10) === itPhone.slice(-10));
    const a = itVendorName.toLowerCase();
    const b = curShop.toLowerCase();
    const matchesShop = Boolean(
      !isGenericStoreName(curShop) && !isGenericStoreName(itVendorName) && (a === b || (a.length > 5 && b.length > 5 && (a.includes(b) || b.includes(a))))
    );
    const matchesOwner = Boolean(!isGenericStoreName(curOwner) && curOwner.length > 3 && a.includes(curOwner.toLowerCase()));

    return matchesId || matchesPhone || matchesShop || matchesOwner;
  }, [vendor, vendorId, shopName, ownerName, user]);

  return { vendor, shopName, ownerName, vendorPhone, districtName, vendorId, isItemForThisVendor };
}
