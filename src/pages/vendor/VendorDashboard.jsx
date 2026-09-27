import { useState, useEffect, useMemo, useRef } from "react";
import VendorShell from "./VendorShell";
import OrdersTab from "./sections/OrdersTab";
import ProductsTab from "./sections/ProductsTab";
import OverviewTab from "./sections/OverviewTab";
import ProfileTab from "./sections/ProfileTab";
import CatalogSheet from "./sections/CatalogSheet";
import EditListingSheet from "./sections/EditListingSheet";
import NewOrderToast from "./sections/NewOrderToast";
import { useAuth } from "../../context/AuthContext";
import { useAdmin } from "../../context/AdminContext";
import { useOrders } from "../../context/OrderContext";
import { useAlert } from "../../context/AlertContext";
import { formatShortId } from "../../utils/formatId";
import { mergeOrderLists } from "../../utils/orderPagination";
import {
  notifyVendorNewOrder,
  requestOrderNotificationPermission,
} from "../../utils/orderAlertSound";
import { initVendorPushNotifications } from "../../utils/pushNotifications";

// Helper for ultra-fast, zero-latency image resolution with bundled offline assets
const resolveProductImage = (imageUrl, categoryName = "", productName = "") => {
  const cat = (categoryName || "").toLowerCase();
  const name = (productName || "").toLowerCase();

  const getBundledAsset = () => {
    if (cat.includes("cement") || name.includes("cement") || name.includes("birla") || name.includes("acc") || name.includes("ultratech") || name.includes("ambuja")) {
      return "/categories/cement.png";
    }
    if (cat.includes("steel") || cat.includes("tmt") || name.includes("steel") || name.includes("tmt") || name.includes("jindal") || name.includes("tata tiscon")) {
      return "/categories/steel.png";
    }
    if (cat.includes("paint") || name.includes("paint") || name.includes("asian") || name.includes("berger") || name.includes("nerolac")) {
      return "/categories/paints.png";
    }
    if (cat.includes("plumb") || cat.includes("pipe") || name.includes("pipe") || name.includes("astral") || name.includes("ashirvad") || name.includes("supreme")) {
      return "/categories/plumbing.png";
    }
    if (cat.includes("tile") || cat.includes("marble") || name.includes("tile") || name.includes("kajaria") || name.includes("somany")) {
      return "/categories/tiles.png";
    }
    if (cat.includes("stone") || cat.includes("sand") || cat.includes("aggregate") || cat.includes("gitti") || cat.includes("morang") || cat.includes("balu")) {
      return "/categories/crushed_stone.png";
    }
    if (cat.includes("rebar") || name.includes("rebar") || name.includes("rod") || name.includes("sariya")) {
      return "/categories/rebars.png";
    }
    return "/categories/cement.png";
  };

  // If no URL or empty string, fallback to bundled category asset
  if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
    return getBundledAsset();
  }

  // If already a local asset, return as-is
  if (imageUrl.startsWith("/") || imageUrl.startsWith("assets/")) {
    return imageUrl;
  }

  // If Unsplash, optimize with thumbnail params to load fast
  if (imageUrl.includes("images.unsplash.com")) {
    const base = imageUrl.split("?")[0];
    return `${base}?auto=format&fit=crop&w=300&h=300&q=80`;
  }

  return imageUrl;
};

// Vendor Dashboard component — Vendor partner ka main portal (Master Catalog selection, Custom Price & Stock setting, Orders management)
export default function VendorDashboard() {
  const { user, logout } = useAuth();
  const { showAlert, showConfirm } = useAlert();
  const {
    masterProducts = [],
    vendors = [],
    products = [],
    productsLoading,
    categories = [],
    assignMasterProductToVendor,
    updateVendorProductListing,
    removeVendorProductListing,
  } = useAdmin();
  const { orders = [], fetchVendorOrders, fetchVendorOrdersPage, updateOrderStatus, ordersSummary } = useOrders();

  // Logged-in Vendor Info details extraction matching DB Vendors (resolved early for 0ms cache lookups)
  const matchedVendorObj = useMemo(() => {
    const found = (vendors || []).find((v) => {
      const userPhoneClean = user?.phone ? user.phone.replace(/\D/g, "") : "";
      const vPhoneClean = v.phone ? v.phone.replace(/\D/g, "") : "";
      const vUserPhoneClean = v.user?.phone ? v.user.phone.replace(/\D/g, "") : "";

      const phoneMatches = userPhoneClean && (vPhoneClean === userPhoneClean || vUserPhoneClean === userPhoneClean);
      const idMatches =
        (user?.vendorInfo?.id && (v.id === user.vendorInfo.id || v.userId === user.vendorInfo.id)) ||
        (user?.vendorId && (v.id === user.vendorId || v.userId === user.vendorId)) ||
        (user?.id && (v.id === user.id || v.userId === user.id));

      return phoneMatches || idMatches;
    });
    return found || user?.vendorInfo || {};
  }, [vendors, user]);

  const shopName = matchedVendorObj.shopName || user?.vendorInfo?.shopName || user?.shopName || user?.name || "Distributor Store";
  const ownerName = matchedVendorObj.ownerName || user?.vendorInfo?.ownerName || user?.name || "Vendor Owner";
  const vendorPhone = matchedVendorObj.phone || user?.phone || user?.vendorInfo?.phone || "9876543210";
  const districtName = matchedVendorObj.region?.name || matchedVendorObj.regionName || matchedVendorObj.districtName || user?.vendorInfo?.region?.name || user?.vendorInfo?.regionName || "Mirzapur";
  const vendorId = matchedVendorObj.id || user?.vendorInfo?.id || user?.vendorId || user?.id || (user?.phone ? `v-${user.phone}` : `v-${Date.now()}`);

  // Tabs navigation state: "orders" -> Default Open Screen, "products" -> My Shop Items, "overview" -> Store Info, "profile" -> Vendor Profile
  const [activeTab, setActiveTabState] = useState("orders");
  const [tabHistory, setTabHistory] = useState(["orders"]);

  // ⚡ 0-Delay Instant Frame 1 Cache: Load previous orders immediately so screen is NEVER blank
  // Older (mostly completed) orders beyond the first page, loaded on demand
  const [olderVendorOrders, setOlderVendorOrders] = useState([]);
  const [vendorOrdersCursor, setVendorOrdersCursor] = useState(null);
  const [vendorHasMoreOrders, setVendorHasMoreOrders] = useState(false);
  const [loadingMoreVendorOrders, setLoadingMoreVendorOrders] = useState(false);
  const olderVendorPagesLoadedRef = useRef(false);

  const [fetchedVendorOrders, setFetchedVendorOrders] = useState(() => {
    try {
      // Check if app was opened via push notification with a pending incoming order
      let instantStub = null;
      try {
        const pendingHighlightId = localStorage.getItem("buildcity_pending_highlight_order");
        const instantOrderStr = localStorage.getItem("buildcity_instant_incoming_order");
        if (pendingHighlightId && instantOrderStr) {
          const instantData = JSON.parse(instantOrderStr);
          if (instantData && (String(instantData.orderId) === String(pendingHighlightId) || String(instantData.id) === String(pendingHighlightId))) {
            instantStub = {
              id: String(pendingHighlightId),
              orderNumber: String(instantData.orderNumber || pendingHighlightId),
              status: "PENDING",
              totalAmount: Number(instantData.amount || 0),
              total: Number(instantData.amount || 0),
              createdAt: new Date().toISOString(),
              items: [],
              customer: { name: "Customer", phone: "" },
              address: { street: "Site Delivery Address" },
              _isInstantStub: true,
            };
          }
        }
      } catch (_) {}

      const vKey = `buildcity_vendor_orders_${vendorId}`;
      const saved = localStorage.getItem(vKey) || localStorage.getItem("buildcity_last_vendor_orders");
      let list = [];
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      }
      if (list.length === 0) {
        // Fallback: check any vendor order cache in localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith("buildcity_vendor_orders_")) {
            const val = localStorage.getItem(k);
            if (val) {
              const p = JSON.parse(val);
              if (Array.isArray(p) && p.length > 0) { list = p; break; }
            }
          }
        }
      }
      if (instantStub) {
        const exists = list.some((o) => String(o.id) === String(instantStub.id) || String(o.orderNumber) === String(instantStub.id));
        if (!exists) {
          return [instantStub, ...list];
        }
      }
      return list;
    } catch {}
    return [];
  });

  const [ordersLoaded, setOrdersLoaded] = useState(() => {
    try {
      const vKey = `buildcity_vendor_orders_${vendorId}`;
      const saved = localStorage.getItem(vKey) || localStorage.getItem("buildcity_last_vendor_orders");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return true;
      }
    } catch {}
    return false;
  });

  // Change tab and track history for Android back navigation
  const switchTab = (newTab) => {
    if (newTab === activeTab) return;
    setActiveTabState(newTab);
    setTabHistory((prev) => [...prev, newTab]);
  };
  const setActiveTab = switchTab;

  // Master Catalog — Admin/DR dwara banaye gaye Master Products select karne ke liye
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [selectedMasterProd, setSelectedMasterProd] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [catalogSearch, setCatalogSearch] = useState("");

  // Pricing, MRP & Discount % State — Vendor custom offer setting
  const [vendorMrp, setVendorMrp] = useState("");
  const [vendorDiscountPct, setVendorDiscountPct] = useState(10);
  const [vendorSellingPrice, setVendorSellingPrice] = useState("");
  const [vendorStockQty, setVendorStockQty] = useState(100);

  // Edit Listing - Custom selling price, MRP, discount and stock modify karne ke liye
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUpdatingListing, setIsUpdatingListing] = useState(false);
  const [isAddingToStore, setIsAddingToStore] = useState(false);

  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);
  const highlightTimerRef = useRef(null);
  const knownOrderIdsRef = useRef(new Set());
  const initialLoadDoneRef = useRef(false);
  const optimisticStatusMapRef = useRef(new Map());

  const triggerOrderHighlight = (orderId) => {
    if (!orderId) return;
    setActiveTabState("orders");
    setOrderStatusFilter("ALL");
    setOrderSearch("");
    setHighlightedOrderId(orderId);

    // Multi-attempt smooth scroll: Tries up to 12 times (3 seconds) to ensure the card is in DOM and centered!
    let attempts = 0;
    const scrollInterval = setInterval(() => {
      attempts++;
      const el = document.getElementById(`vendor-order-${orderId}`) ||
                 document.getElementById(`vendor-order-row-${orderId}`) ||
                 document.querySelector(`[data-order-id="${orderId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        clearInterval(scrollInterval);
      } else if (attempts >= 12) {
        clearInterval(scrollInterval);
      }
    }, 250);

    // ⏱️ Auto-dismiss highlight glow and badge strictly after 5 seconds!
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedOrderId((curr) => (curr === orderId ? null : curr));
      try {
        if (localStorage.getItem("buildcity_pending_highlight_order") === String(orderId)) {
          localStorage.removeItem("buildcity_pending_highlight_order");
        }
        localStorage.removeItem("buildcity_instant_incoming_order");
      } catch (_) {}
    }, 5000);
  };

  // Auto-request notification permission on mount for native sound & alerts + FCM background push
  useEffect(() => {
    requestOrderNotificationPermission().catch(() => {});
    const activeVid = vendorId || user?.vendorInfo?.id || user?.id;
    if (activeVid) {
      const vPhone = user?.phone || matchedVendorObj?.phone || "";
      initVendorPushNotifications(activeVid, { phone: vPhone }).catch(() => {});
    }
  }, [vendorId, user?.id, user?.phone]);

  // Smart Vendor Orders Sync: Instant Event Sync + Focus/Visibility Aware + Loud Alert on New Orders
  useEffect(() => {
    let isMounted = true;
    const syncVendorOrders = async () => {
      try {
        // Newest page + every open order; falls back to cached orders when offline
        let vOrds;
        try {
          const page = await fetchVendorOrdersPage(vendorId);
          vOrds = page.orders;
          if (isMounted && !olderVendorPagesLoadedRef.current) {
            setVendorOrdersCursor(page.nextCursor);
            setVendorHasMoreOrders(page.hasMore);
          }
        } catch {
          vOrds = await fetchVendorOrders(vendorId);
        }
        if (isMounted && Array.isArray(vOrds)) {
          // Detect newly arrived orders for this vendor
          if (initialLoadDoneRef.current) {
            const newlyArrived = vOrds.filter((o) => o?.id && !knownOrderIdsRef.current.has(o.id));
            if (newlyArrived.length > 0) {
              const latest = newlyArrived[0];
              // 🔔 Trigger Loud Chime Sound + Phone Vibration + Android Native Notification!
              notifyVendorNewOrder(latest);
              setNewOrderAlert(latest);
              // Auto-dismiss popup banner strictly after 5 seconds
              setTimeout(() => {
                setNewOrderAlert((curr) => (curr?.id === latest.id ? null : curr));
              }, 5000);
            }
          }

          // Register all current order IDs to known set
          vOrds.forEach((o) => {
            if (o?.id) knownOrderIdsRef.current.add(o.id);
          });
          initialLoadDoneRef.current = true;

          // Prune optimistic map entries older than 20 seconds
          const now = Date.now();
          for (const [id, data] of optimisticStatusMapRef.current.entries()) {
            if (now - data.timestamp > 20000) {
              optimisticStatusMapRef.current.delete(id);
            }
          }

          // Protect active optimistic status changes from being overwritten by stale background polling
          const cleanVOrds = vOrds.map((o) => {
            if (o?.id && optimisticStatusMapRef.current.has(o.id)) {
              const opt = optimisticStatusMapRef.current.get(o.id);
              return { ...o, status: opt.status };
            }
            return o;
          });

          setFetchedVendorOrders((prev) => {
            if (prev.length === cleanVOrds.length && JSON.stringify(prev) === JSON.stringify(cleanVOrds)) {
              return prev;
            }
            return cleanVOrds;
          });
          try {
            localStorage.setItem(`buildcity_vendor_orders_${vendorId}`, JSON.stringify(cleanVOrds));
            localStorage.setItem("buildcity_last_vendor_orders", JSON.stringify(cleanVOrds));
          } catch {}
          setOrdersLoaded(true);

          // Check if app was opened by tapping a notification
          try {
            const pendingHighlightId = localStorage.getItem("buildcity_pending_highlight_order");
            const pendingHighlightTime = Number(localStorage.getItem("buildcity_pending_highlight_time") || 0);
            if (pendingHighlightId && Date.now() - pendingHighlightTime < 300000) {
              triggerOrderHighlight(pendingHighlightId);
            }
          } catch (_) {}
        }
      } catch {
        if (isMounted) setOrdersLoaded(true);
      }
    };

    // On mount check for pending notification click order
    try {
      const pendingHighlightId = localStorage.getItem("buildcity_pending_highlight_order");
      const pendingHighlightTime = Number(localStorage.getItem("buildcity_pending_highlight_time") || 0);
      if (pendingHighlightId && Date.now() - pendingHighlightTime < 300000) {
        triggerOrderHighlight(pendingHighlightId);
      }
    } catch (_) {}

    syncVendorOrders();

    // 1. Smart Fallback Interval (60s, visibility-aware — saves 90% egress while tab is idle or hidden)
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        syncVendorOrders();
      }
    }, 60000);

    // 2. Instant Sync on Focus / Visibility
    const handleFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        syncVendorOrders();
      }
    };

    // 3. Instant Event-Driven Sync & Push Notification Click Auto-Scroll
    const handleOrderEvent = () => syncVendorOrders();
    const handleHighlightEvent = (e) => {
      const oId = e.detail?.orderId;
      if (oId) {
        // ⚡ INSTANT OPTIMISTIC INJECTION: If this order is not yet in fetchedVendorOrders, inject it immediately!
        try {
          const instantOrderStr = localStorage.getItem("buildcity_instant_incoming_order");
          if (instantOrderStr) {
            const instantData = JSON.parse(instantOrderStr);
            if (instantData && (String(instantData.orderId) === String(oId) || String(instantData.id) === String(oId))) {
              setFetchedVendorOrders((prev) => {
                const exists = prev.some((o) => String(o.id) === String(oId) || String(o.orderNumber) === String(oId));
                if (!exists) {
                  const stub = {
                    id: String(oId),
                    orderNumber: String(instantData.orderNumber || oId),
                    status: "PENDING",
                    totalAmount: Number(instantData.amount || 0),
                    total: Number(instantData.amount || 0),
                    createdAt: new Date().toISOString(),
                    items: [],
                    customer: { name: "Customer", phone: "" },
                    address: { street: "Site Delivery Address" },
                    _isInstantStub: true,
                  };
                  return [stub, ...prev];
                }
                return prev;
              });
            }
          }
        } catch (_) {}
        triggerOrderHighlight(oId);
      }
    };
    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("buildcity_orders_updated", handleOrderEvent);
    window.addEventListener("buildcity_order_placed", handleOrderEvent);
    window.addEventListener("buildcity_order_highlight", handleHighlightEvent);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("buildcity_orders_updated", handleOrderEvent);
      window.removeEventListener("buildcity_order_placed", handleOrderEvent);
      window.removeEventListener("buildcity_order_highlight", handleHighlightEvent);
    };
  }, [vendorId, shopName]);

  // Handle Android Native Back Button: Closes modal first -> Go back in tab history -> Exit only on final initial tab!
  useEffect(() => {
    window.__buildcity_vendor_back_handler = () => {
      // 1. If Catalog modal is open, close it
      if (showCatalogModal) {
        setShowCatalogModal(false);
        return true;
      }
      // 2. If Product Edit sheet is open, close it
      if (editingProduct) {
        setEditingProduct(null);
        return true;
      }
      // 3. If there is previous tab history, go back to previous tab
      if (tabHistory.length > 1) {
        const updatedHistory = [...tabHistory];
        updatedHistory.pop(); // Remove current tab
        const prevTab = updatedHistory[updatedHistory.length - 1];
        setTabHistory(updatedHistory);
        setActiveTabState(prevTab);
        return true; // Back action consumed, app does not exit!
      }
      // Return false if on last/initial tab so Android can safely exit app
      return false;
    };

    return () => {
      window.__buildcity_vendor_back_handler = null;
    };
  }, [showCatalogModal, editingProduct, tabHistory]);

  // Lock document body scroll when modal/full-page sheet is open so background never scrolls
  useEffect(() => {
    if (showCatalogModal || editingProduct) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [showCatalogModal, editingProduct]);

  // Strict Vendor Orders Isolation:
  // Primary and authoritative source is fetchedVendorOrders (returned directly by /api/v1/orders/vendor/:id).
  // Never merge raw global context orders to prevent order count oscillation.
  const isGenericStoreName = (str = "") => {
    const s = String(str || "").trim().toLowerCase();
    return !s || ["distributor store", "vendor owner", "vendor partner", "district vendor", "vendor", "store", "shop"].includes(s);
  };

  const isItemForThisVendor = (it) => {
    if (!it) return false;
    const itVendorId = it.vendorId || it.vendor?.id;
    const itVendorName = String(it.vendorName || it.vendor?.shopName || "").trim();
    const curShop = String(shopName || "").trim();
    const curOwner = String(ownerName || "").trim();
    const curPhone = (user?.phone || matchedVendorObj.phone || "").replace(/\D/g, "");
    const itPhone = (it.vendor?.phone || "").replace(/\D/g, "");

    const matchesId = Boolean(
      itVendorId && (
        itVendorId === vendorId ||
        itVendorId === matchedVendorObj.id ||
        (user?.id && itVendorId === user.id) ||
        (user?.vendorInfo?.id && itVendorId === user.vendorInfo.id) ||
        (matchedVendorObj.userId && itVendorId === matchedVendorObj.userId)
      )
    );
    const matchesPhone = Boolean(curPhone && itPhone && curPhone.length >= 8 && itPhone.length >= 8 && curPhone.slice(-10) === itPhone.slice(-10));
    const matchesShop = Boolean(
      !isGenericStoreName(curShop) &&
      !isGenericStoreName(itVendorName) &&
      (itVendorName.toLowerCase() === curShop.toLowerCase() ||
        (itVendorName.length > 5 && curShop.length > 5 && (itVendorName.toLowerCase().includes(curShop.toLowerCase()) || curShop.toLowerCase().includes(itVendorName.toLowerCase()))))
    );
    const matchesOwner = Boolean(!isGenericStoreName(curOwner) && curOwner.length > 3 && itVendorName.toLowerCase().includes(curOwner.toLowerCase()));

    return Boolean(matchesId || matchesPhone || matchesShop || matchesOwner);
  };

  // Appends the next page of older orders (marked as known so they never trigger a new-order alert)
  const loadMoreVendorOrders = async () => {
    if (!vendorOrdersCursor || loadingMoreVendorOrders) return;
    setLoadingMoreVendorOrders(true);
    try {
      const page = await fetchVendorOrdersPage(vendorId, vendorOrdersCursor);
      page.orders.forEach((o) => {
        if (o?.id) knownOrderIdsRef.current.add(o.id);
      });
      olderVendorPagesLoadedRef.current = true;
      setOlderVendorOrders((prev) => mergeOrderLists(prev, page.orders));
      setVendorOrdersCursor(page.nextCursor);
      setVendorHasMoreOrders(page.hasMore);
    } catch (err) {
      console.warn("Load more vendor orders note:", err.message);
    } finally {
      setLoadingMoreVendorOrders(false);
    }
  };

  // Dedicated candidate orders: When loaded or has data, strictly use fetchedVendorOrders (+ older pages)
  const candidateOrders = (fetchedVendorOrders && fetchedVendorOrders.length > 0)
    ? (olderVendorOrders.length > 0 ? mergeOrderLists(fetchedVendorOrders, olderVendorOrders) : fetchedVendorOrders)
    : (ordersLoaded
        ? []
        : (orders || []).filter((o) => Array.isArray(o.items) && o.items.some(isItemForThisVendor)));

  const vendorOrderMap = new Map();
  candidateOrders.forEach((o) => {
    if (o && o.id && !vendorOrderMap.has(o.id)) {
      vendorOrderMap.set(o.id, o);
    }
  });

  const vendorOrders = Array.from(vendorOrderMap.values())
    .map((o) => {
      if (!o || !Array.isArray(o.items) || o.items.length === 0) return null;

      // Filter items for this vendor
      let myItems = o.items.filter(isItemForThisVendor);

      // If backend /api/v1/orders/vendor/:id returned this order, the items are already this vendor's items!
      if (myItems.length === 0 && (ordersLoaded || (fetchedVendorOrders || []).some((f) => f.id === o.id))) {
        myItems = o.items;
      }

      if (myItems.length === 0) return null;

      // Calculate total price for this vendor's items only
      const vendorItemsTotal = myItems.reduce((acc, it) => {
        const qty = Number(it.quantity || it.qty || it.count || 1);
        const rawPrice = it.price ?? it.unitPrice ?? it.priceAtPurchase ?? it.sellingPrice ?? it.rate;
        let line = 0;
        if (rawPrice !== undefined && rawPrice !== null && !isNaN(Number(rawPrice)) && Number(rawPrice) > 0) {
          line = Number(rawPrice) * qty;
        } else if (it.totalPrice || it.total || it.amount) {
          line = Number(it.totalPrice || it.total || it.amount) || 0;
        }
        return acc + line;
      }, 0);

      const totalItemsInOrder = o.totalOrderItemsCount || o.items.length;
      const isSingleVendor = myItems.length === totalItemsInOrder;
      const orderTotal = o.vendorItemsTotal || (isSingleVendor && (o.totalAmount || o.total)
        ? Number(o.totalAmount || o.total)
        : vendorItemsTotal);

      return {
        ...o,
        items: myItems,
        totalAmount: orderTotal,
        total: orderTotal,
        vendorItemsTotal: o.vendorItemsTotal || vendorItemsTotal,
        isPartialOrder: !isSingleVendor,
        totalOrderItemsCount: totalItemsInOrder,
      };
    })
    .filter(Boolean);

  // Category Bubble image resolver matching circular category tiles
  const resolveCategoryBubbleImage = (catName = "") => {
    const lower = (catName || "").toLowerCase().trim();
    if (lower.includes("cement")) return "/categories/cement.png";
    if (lower.includes("steel")) return "/categories/steel.png";
    if (lower.includes("rebar") || lower.includes("sariya")) return "/categories/rebars.png";
    if (lower.includes("stone") || lower.includes("gitti") || lower.includes("crush") || lower.includes("aggregate")) return "/categories/crushed_stone.png";
    if (lower.includes("tile")) return "/categories/tiles.png";
    if (lower.includes("plumb") || lower.includes("pipe")) return "/categories/plumbing.png";
    if (lower.includes("paint")) return "/categories/paints.png";
    if (lower.includes("brick")) return "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=160&q=80";
    if (lower.includes("elect")) return "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=160&q=80";
    return "/categories/cement.png";
  };

  // State for filtering vendor's own listed store products by category & search query
  const [vendorStoreCategoryFilter, setVendorStoreCategoryFilter] = useState("ALL");
  const [productSearch, setProductSearch] = useState("");
  const [orderSectionTab, setOrderSectionTab] = useState("ACTIVE"); // 'ACTIVE' (Pending, Processing, Out) vs 'COMPLETED' (Delivered, Cancelled)
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [orderSearch, setOrderSearch] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [statusTransition, setStatusTransition] = useState(null); // { orderId, targetStatus }

  // Current vendor ki dukan par list huye products filter karo (Flexible DB Match)
  const vendorProducts = products.filter((p) => {
    if (!p) return false;
    const matchesId = p.vendorId && (p.vendorId === vendorId || p.vendorId === matchedVendorObj.id || p.vendorId === user?.id);
    const pShop = (p.vendorName || p.vendor?.shopName || "").toLowerCase().trim();
    const curShop = shopName.toLowerCase().trim();
    const curOwner = ownerName.toLowerCase().trim();
    const matchesShop = curShop && pShop && (pShop.includes(curShop) || curShop.includes(pShop));
    const matchesOwner = curOwner && p.vendor?.ownerName && p.vendor.ownerName.toLowerCase().includes(curOwner);
    return matchesId || matchesShop || matchesOwner;
  });

  // Category Bubbles list (Home screen round story bubbles style)
  const staticCategoryBubbles = [
    { id: "Cement", name: "Cement", img: "/categories/cement.png" },
    { id: "Steel", name: "Steel", img: "/categories/steel.png" },
    { id: "Rebars", name: "Rebars", img: "/categories/rebars.png" },
    { id: "Crushed Stone", name: "Crushed Stone", img: "/categories/crushed_stone.png" },
    { id: "Tiles", name: "Tiles", img: "/categories/tiles.png" },
    { id: "Plumbing", name: "Plumbing", img: "/categories/plumbing.png" },
    { id: "Paints", name: "Paints", img: "/categories/paints.png" },
  ];

  const categoryBubbleMap = new Map();
  staticCategoryBubbles.forEach((c) => categoryBubbleMap.set(c.name.toLowerCase(), c));
  (categories || []).forEach((c) => {
    const key = (c.name || "").toLowerCase();
    if (!categoryBubbleMap.has(key)) {
      categoryBubbleMap.set(key, {
        id: c.id,
        name: c.name,
        img: resolveCategoryBubbleImage(c.name),
      });
    }
  });
  const allCategoryBubbles = Array.from(categoryBubbleMap.values());

  // Selected category ke mutabiq filtered vendor products
  const filteredVendorProducts = vendorProducts.filter((p) => {
    if (vendorStoreCategoryFilter === "ALL") return true;
    const pCatId = p.categoryId || "";
    const pCatName = (p.categoryName || "").toLowerCase();
    const targetFilter = vendorStoreCategoryFilter.toLowerCase();
    return pCatId === vendorStoreCategoryFilter || pCatName === targetFilter || pCatName.includes(targetFilter);
  });

  // Live search query filtered products for vendor's products page
  const displayedVendorProducts = filteredVendorProducts.filter((p) => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(q) ||
      (p.brand || "").toLowerCase().includes(q) ||
      (p.categoryName || "").toLowerCase().includes(q) ||
      (p.grade || "").toLowerCase().includes(q)
    );
  });

  // Calculate customer order counts (detect repeat buyers / frequent customers)
  const customerOrderCounts = useMemo(() => {
    const counts = {};
    vendorOrders.forEach((o) => {
      const rawAddr = o.address;
      const isObj = typeof rawAddr === "object" && rawAddr !== null;
      const phone = ((isObj && rawAddr.phone) || o.customer?.phone || o.phone || "").trim();
      const name = ((isObj && (rawAddr.fullName || rawAddr.name)) || o.customer?.name || (typeof o.customer === "string" ? o.customer : "")).trim().toLowerCase();
      const key = phone || name;
      if (key) {
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [vendorOrders]);

  const getCustomerStats = (ord) => {
    const rawAddr = ord.address;
    const isObj = typeof rawAddr === "object" && rawAddr !== null;
    const phone = ((isObj && rawAddr.phone) || ord.customer?.phone || ord.phone || "").trim();
    const name = ((isObj && (rawAddr.fullName || rawAddr.name)) || ord.customer?.name || (typeof ord.customer === "string" ? ord.customer : "")).trim().toLowerCase();
    const key = phone || name;
    const count = key ? (customerOrderCounts[key] || 1) : 1;
    return {
      orderCount: count,
      isRepeat: count > 1,
    };
  };

  // Active Orders (Pending, Processing, Out for Delivery) vs Completed Orders (Delivered, Cancelled)
  const activeOrders = useMemo(() => {
    return vendorOrders.filter((o) => {
      // Keep order visible on Active tab while its 2.5s loading transition is ongoing
      if (statusTransition?.orderId === o.id && orderSectionTab === "ACTIVE") {
        return true;
      }
      const st = (o.status || "PENDING").toUpperCase();
      return st === "PENDING" || st === "PROCESSING" || st === "OUT_FOR_DELIVERY";
    });
  }, [vendorOrders, statusTransition, orderSectionTab]);

  const completedOrders = useMemo(() => {
    return vendorOrders.filter((o) => {
      // Keep order visible on Completed tab while its 2.5s loading transition is ongoing
      if (statusTransition?.orderId === o.id && orderSectionTab === "COMPLETED") {
        return true;
      }
      const st = (o.status || "").toUpperCase();
      return st === "DELIVERED" || st === "CANCELLED";
    });
  }, [vendorOrders, statusTransition, orderSectionTab]);

  const pendingOrdersCount = vendorOrders.filter((o) => (o.status || "PENDING").toUpperCase() === "PENDING").length;

  // Filtered orders for dedicated orders page (with tab, status, search, and repeat filter + Smart Pending-First Sort)
  const filteredVendorOrders = useMemo(() => {
    // 1. First partition by Selected Section Tab (ACTIVE vs COMPLETED)
    const baseOrders = orderSectionTab === "ACTIVE" ? activeOrders : completedOrders;

    const filtered = baseOrders.filter((ord) => {
      // If currently undergoing status transition, keep visible so vendor clearly sees it moving!
      if (statusTransition?.orderId === ord.id) return true;

      // Status / Repeat Buyer Filter within the active tab
      if (orderStatusFilter === "REPEAT_BUYERS") {
        if (!getCustomerStats(ord).isRepeat) return false;
      } else if (orderStatusFilter !== "ALL") {
        if ((ord.status || "PENDING").toUpperCase() !== orderStatusFilter) return false;
      }

      // Search query filter (Order ID, Customer Name, Phone, Items, Delivery Address)
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase().trim();
        const rawAddr = ord.address;
        const isObj = typeof rawAddr === "object" && rawAddr !== null;
        const isStr = typeof rawAddr === "string" && rawAddr.trim().length > 0;
        const custName = ((isObj && (rawAddr.fullName || rawAddr.name)) || ord.customer?.name || (typeof ord.customer === "string" ? ord.customer : "")).toLowerCase();
        const phone = ((isObj && rawAddr.phone) || ord.customer?.phone || ord.phone || "").toLowerCase();
        const ordId = String(ord.id || ord.orderNumber || "").toLowerCase();
        const formattedId = formatShortId(ord.id || ord.orderNumber, "ORD").toLowerCase();
        const street = (isObj ? (rawAddr.street || rawAddr.line || rawAddr.address) : (isStr ? rawAddr : "")).toLowerCase();
        const city = (isObj ? rawAddr.city : (ord.districtName || ord.regionName || "")).toLowerCase();

        const itemsMatch = Array.isArray(ord.items)
          ? ord.items.some((i) => (i.productName || i.name || "").toLowerCase().includes(q))
          : String(ord.items || "").toLowerCase().includes(q);

        const matchesSearch =
          custName.includes(q) ||
          phone.includes(q) ||
          ordId.includes(q) ||
          formattedId.includes(q) ||
          street.includes(q) ||
          city.includes(q) ||
          itemsMatch;

        if (!matchesSearch) return false;
      }

      return true;
    });

    // 2. Smart Priority Sorting:
    // For ACTIVE tab: PENDING first (urgency!), then PROCESSING, then OUT_FOR_DELIVERY, then newest date
    // For COMPLETED tab: Newest date first
    return filtered.sort((a, b) => {
      if (orderSectionTab === "ACTIVE") {
        const priority = { PENDING: 1, PROCESSING: 2, OUT_FOR_DELIVERY: 3 };
        const pA = priority[(a.status || "PENDING").toUpperCase()] || 99;
        const pB = priority[(b.status || "PENDING").toUpperCase()] || 99;
        if (pA !== pB) return pA - pB;
      }
      const timeA = new Date(a.createdAt || a.date || 0).getTime();
      const timeB = new Date(b.createdAt || b.date || 0).getTime();
      return timeB - timeA;
    });
  }, [vendorOrders, activeOrders, completedOrders, orderSectionTab, orderStatusFilter, orderSearch, customerOrderCounts]);

  // Quick stock stepper handler (+/- on 2x2 product card)
  const handleQuickStockChange = async (prod, delta) => {
    const curStock = Number(prod.stockQty) || 0;
    const newStock = Math.max(0, curStock + delta);
    if (newStock === curStock) return;
    try {
      await updateVendorProductListing(prod.id, {
        price: Number(prod.price),
        mrp: Number(prod.mrp || prod.price),
        stockQty: newStock,
      });
    } catch (err) {
      console.warn("Stock change error:", err);
    }
  };

  // Category aur search term ke mutabiq Master Catalog products filter karo
  const filteredMasterProducts = masterProducts.filter((mp) => {
    const matchesCategory =
      selectedCategoryFilter === "ALL" || mp.categoryId === selectedCategoryFilter;
    const matchesSearch =
      mp.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      mp.brand.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      mp.categoryName.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      mp.type.toLowerCase().includes(catalogSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenMasterProductSelect = (mp) => {
    if (selectedMasterProd?.id === mp.id) {
      setSelectedMasterProd(null);
      return;
    }
    setSelectedMasterProd(mp);
    const mrp = Number(mp.suggestedPrice) || 390;
    const defaultDisc = 10;
    const calcSelling = Math.round(mrp * (1 - defaultDisc / 100));
    setVendorMrp(mrp);
    setVendorDiscountPct(defaultDisc);
    setVendorSellingPrice(calcSelling);
    setVendorStockQty(100);
  };

  const handleSellingPriceChange = (val) => {
    setVendorSellingPrice(val);
    const numPrice = Number(val) || 0;
    const numMrp = Number(vendorMrp) || 0;
    if (numMrp > 0 && numPrice > 0 && numPrice <= numMrp) {
      setVendorDiscountPct(Math.round(((numMrp - numPrice) / numMrp) * 100));
    }
  };

  const handleDiscountChange = (val) => {
    setVendorDiscountPct(val);
    const numDisc = Number(val) || 0;
    const numMrp = Number(vendorMrp) || 0;
    if (numMrp > 0) {
      setVendorSellingPrice(Math.round(numMrp * (1 - numDisc / 100)));
    }
  };

  const handleMrpChange = (val) => {
    setVendorMrp(val);
    const numMrp = Number(val) || 0;
    const numDisc = Number(vendorDiscountPct) || 0;
    if (numMrp > 0) {
      setVendorSellingPrice(Math.round(numMrp * (1 - numDisc / 100)));
    }
  };

  const handleAddMasterProductToStore = async (e) => {
    e.preventDefault();
    if (!selectedMasterProd || !vendorSellingPrice) return;

    setIsAddingToStore(true);
    try {
      const prodName = selectedMasterProd.name;
      const targetPrice = vendorSellingPrice;
      const targetDisc = vendorDiscountPct;

      await assignMasterProductToVendor({
        masterProductId: selectedMasterProd.id,
        vendorId: vendorId,
        vendorName: shopName,
        regionId: matchedVendorObj.regionId || user?.vendorInfo?.regionId,
        regionName: districtName || matchedVendorObj.regionName || "Mirzapur",
        districtName: districtName || matchedVendorObj.regionName || "Mirzapur",
        price: Number(vendorSellingPrice),
        mrp: Number(vendorMrp) || Number(selectedMasterProd.suggestedPrice) || Number(vendorSellingPrice),
        stockQty: Number(vendorStockQty) || 0,
        addedBy: `Vendor (${shopName})`,
      });

      setSelectedMasterProd(null);
      showAlert({
        title: "Submitted for review",
        message: `${prodName} will go live once your district team approves it.\n\nPrice ₹${targetPrice}${Number(targetDisc) > 0 ? ` (${targetDisc}% off)` : ""} · Stock ${vendorStockQty}`,
        type: "success",
        buttonText: "Done",
      });
    } catch (err) {
      showAlert({
        title: "Couldn't submit",
        message: err.message || "Please try again.",
        type: "warning",
      });
    } finally {
      setIsAddingToStore(false);
    }
  };

  const handleOpenEditProduct = (p) => {
    const price = Number(p.price) || 100;
    const mrp = Number(p.mrp || p.masterProduct?.suggestedPrice || Math.round(price * 1.2));
    const disc = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
    setEditingProduct({
      ...p,
      mrp: mrp,
      price: price,
      discountPct: disc,
      stockQty: p.stockQty !== undefined ? p.stockQty : 100,
    });
  };

  const handleEditPriceChange = (val) => {
    const numPrice = Number(val) || 0;
    const numMrp = Number(editingProduct.mrp) || 0;
    const disc = numMrp > numPrice && numPrice > 0 ? Math.round(((numMrp - numPrice) / numMrp) * 100) : 0;
    setEditingProduct((prev) => ({ ...prev, price: val, discountPct: disc }));
  };

  const handleEditDiscountChange = (val) => {
    const numDisc = Number(val) || 0;
    const numMrp = Number(editingProduct.mrp) || 0;
    const newPrice = numMrp > 0 ? Math.round(numMrp * (1 - numDisc / 100)) : editingProduct.price;
    setEditingProduct((prev) => ({ ...prev, discountPct: val, price: newPrice }));
  };

  const handleEditMrpChange = (val) => {
    const numMrp = Number(val) || 0;
    const numDisc = Number(editingProduct.discountPct) || 0;
    const newPrice = numMrp > 0 ? Math.round(numMrp * (1 - numDisc / 100)) : editingProduct.price;
    setEditingProduct((prev) => ({ ...prev, mrp: val, price: newPrice }));
  };

  const handleUpdateListing = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    const prodToSave = { ...editingProduct };
    const updatedPrice = prodToSave.price;
    const updatedDisc = prodToSave.discountPct;
    setEditingProduct(null);
    showAlert({
      title: "Listing updated",
      message: `Customers now see ₹${updatedPrice}${Number(updatedDisc) > 0 ? ` (${updatedDisc}% off)` : ""}.`,
      type: "success",
      buttonText: "Done",
    });

    try {
      await updateVendorProductListing(prodToSave.id, {
        price: Number(prodToSave.price),
        mrp: Number(prodToSave.mrp),
        stockQty: Number(prodToSave.stockQty),
      });
    } catch (err) {
      console.warn("Background update listing note:", err.message);
    }
  };

  const handleRemoveListing = (id, name) => {
    showConfirm({
      title: "Remove Store Listing?",
      message: `Remove "${name}" from your store listings?`,
      type: "warning",
      confirmText: "Remove Listing",
      onConfirm: () => {
        removeVendorProductListing(id);
        showAlert({ title: "Listing Removed", message: `"${name}" removed from your store.`, type: "info" });
      },
    });
  };

  // Real DB stats calculation: Revenue counts ONLY when order is DELIVERED!
  const loadedDeliveredRevenue = vendorOrders.reduce((sum, ord) => {
    const st = (ord.status || "").toUpperCase();
    if (st !== "DELIVERED") return sum;
    return sum + (Number(ord.totalAmount || ord.total || 0) || 0);
  }, 0);

  // Orders are paginated: totals come from the server summary (exact across all pages).
  // Math.max keeps just-placed / just-updated orders visible before the next summary refresh.
  const vendorSummary = ordersSummary?.revenueBasis === "delivered_vendor_items" ? ordersSummary : null;
  const totalRevenue = vendorSummary ? Math.max(vendorSummary.totalRevenue, loadedDeliveredRevenue) : loadedDeliveredRevenue;
  const vendorOrdersCount = vendorSummary ? Math.max(vendorSummary.totalOrders, vendorOrders.length) : vendorOrders.length;
  const completedOrdersCount = vendorSummary
    ? Math.max((vendorSummary.byStatus?.DELIVERED || 0) + (vendorSummary.byStatus?.CANCELLED || 0), completedOrders.length)
    : completedOrders.length;

  // Live Status Change handler with real-time loading feedback & instant synchronous persistence
  const handleStatusChange = async (orderId, newStatus) => {
    if (!orderId || !newStatus) return;
    const cleanId = String(orderId);
    setStatusTransition({ orderId: cleanId, targetStatus: newStatus });
    setUpdatingOrderId(cleanId);

    const startTime = Date.now();
    try {
      // 1. Send status update to server in background
      await updateOrderStatus(orderId, newStatus);

      // 2. Enforce 2.5 seconds visible loading window on the CURRENT status card so vendor clearly sees it loading
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 2500 - elapsed);
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      // 3. NOW update local state so the order smoothly moves to its new status / tab!
      optimisticStatusMapRef.current.set(orderId, { status: newStatus, timestamp: Date.now() });
      setFetchedVendorOrders((prev) => {
        const updated = prev.map((o) => (String(o.id) === cleanId ? { ...o, status: newStatus } : o));
        try {
          localStorage.setItem(`buildcity_vendor_orders_${vendorId}`, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    } catch (err) {
      console.warn("Status change error:", err);
      optimisticStatusMapRef.current.delete(orderId);
      showAlert({
        title: "Couldn't update status",
        message: err.message || "Please try again.",
        type: "warning",
      });
    } finally {
      setUpdatingOrderId(null);
      setStatusTransition(null);
    }
  };

  const activeOrdersCount = vendorOrders.filter((o) => {
    const st = (o.status || "").toUpperCase();
    return st === "PENDING" || st === "PROCESSING" || st === "OUT_FOR_DELIVERY";
  }).length;

  // Cancelling is the one status change that needs a second tap
  const requestStatusChange = (orderId, newStatus) => {
    if ((newStatus || "").toUpperCase() === "CANCELLED") {
      showConfirm({
        title: "Cancel this order?",
        message: "It will move to Completed as cancelled.",
        type: "warning",
        confirmText: "Cancel order",
        cancelText: "Keep order",
        onConfirm: () => handleStatusChange(orderId, newStatus),
      });
      return;
    }
    handleStatusChange(orderId, newStatus);
  };

  const imageFor = (p) => ({
    src: resolveProductImage(p.imageUrl || masterProducts.find((m) => m.id === p.masterProductId)?.imageUrl, p.categoryName, p.name),
    fallback: resolveProductImage(null, p.categoryName, p.name),
  });

  const openOrders = (statusFilter = "ALL") => {
    setOrderSectionTab("ACTIVE");
    setOrderStatusFilter(statusFilter);
    setActiveTab("orders");
  };

  const closeCatalog = () => {
    setShowCatalogModal(false);
    setSelectedMasterProd(null);
  };

  return (
    <VendorShell
      shopName={shopName}
      ownerName={ownerName}
      districtName={districtName}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      activeOrdersCount={activeOrdersCount}
      onAddProduct={() => setShowCatalogModal(true)}
    >
      <NewOrderToast
        order={newOrderAlert}
        onDismiss={() => setNewOrderAlert(null)}
        onView={() => {
          triggerOrderHighlight(newOrderAlert.id || newOrderAlert.orderNumber);
          setNewOrderAlert(null);
        }}
      />

      {activeTab === "orders" && (
        <OrdersTab
          districtName={districtName}
          vendorOrders={vendorOrders}
          activeOrders={activeOrders}
          completedOrders={completedOrders}
          filteredOrders={filteredVendorOrders}
          completedOrdersCount={completedOrdersCount}
          vendorOrdersCount={vendorOrdersCount}
          sectionTab={orderSectionTab}
          onSectionTabChange={(tab) => {
            setOrderSectionTab(tab);
            setOrderStatusFilter("ALL");
          }}
          statusFilter={orderStatusFilter}
          onStatusFilterChange={setOrderStatusFilter}
          search={orderSearch}
          onSearchChange={setOrderSearch}
          highlightedOrderId={highlightedOrderId}
          statusTransition={statusTransition}
          updatingOrderId={updatingOrderId}
          getCustomerStats={getCustomerStats}
          onStatusChange={requestStatusChange}
          pagination={{ hasMore: vendorHasMoreOrders, loading: loadingMoreVendorOrders, onLoadMore: loadMoreVendorOrders }}
        />
      )}

      {activeTab === "products" && (
        <ProductsTab
          products={vendorProducts}
          displayedProducts={displayedVendorProducts}
          loading={productsLoading}
          categories={allCategoryBubbles}
          categoryFilter={vendorStoreCategoryFilter}
          onCategoryFilterChange={setVendorStoreCategoryFilter}
          search={productSearch}
          onSearchChange={setProductSearch}
          imageFor={imageFor}
          onEdit={handleOpenEditProduct}
          onAddProduct={() => setShowCatalogModal(true)}
        />
      )}

      {activeTab === "overview" && (
        <OverviewTab
          districtName={districtName}
          totalRevenue={totalRevenue}
          activeOrdersCount={activeOrdersCount}
          pendingOrdersCount={pendingOrdersCount}
          completedOrdersCount={completedOrdersCount}
          vendorOrders={vendorOrders}
          vendorProducts={vendorProducts}
          productsLoading={productsLoading}
          imageFor={imageFor}
          onOpenOrders={() => openOrders()}
          onOpenPending={() => openOrders("PENDING")}
          onOpenProducts={() => setActiveTab("products")}
          onEditProduct={handleOpenEditProduct}
          onAddProduct={() => setShowCatalogModal(true)}
        />
      )}

      {activeTab === "profile" && (
        <ProfileTab
          ownerName={ownerName}
          shopName={shopName}
          vendorPhone={vendorPhone}
          email={user?.email}
          districtName={districtName}
          onLogout={logout}
        />
      )}

      <CatalogSheet
        open={showCatalogModal}
        onClose={closeCatalog}
        totalCount={masterProducts.length}
        products={filteredMasterProducts}
        categories={categories}
        categoryFilter={selectedCategoryFilter}
        onCategoryFilterChange={setSelectedCategoryFilter}
        search={catalogSearch}
        onSearchChange={setCatalogSearch}
        isInStore={(mp) => vendorProducts.some((vp) => vp.masterProductId === mp.id || vp.name === mp.name)}
        selectedId={selectedMasterProd?.id}
        onToggleSelect={handleOpenMasterProductSelect}
        imageFor={imageFor}
        form={{
          mrp: vendorMrp,
          discountPct: vendorDiscountPct,
          sellingPrice: vendorSellingPrice,
          stockQty: vendorStockQty,
          onMrpChange: handleMrpChange,
          onDiscountChange: handleDiscountChange,
          onSellingPriceChange: handleSellingPriceChange,
          onStockChange: setVendorStockQty,
        }}
        onSubmit={handleAddMasterProductToStore}
        isSubmitting={isAddingToStore}
      />

      {editingProduct && (
        <EditListingSheet
          product={editingProduct}
          image={imageFor(editingProduct)}
          onClose={() => setEditingProduct(null)}
          onSubmit={handleUpdateListing}
          onMrpChange={handleEditMrpChange}
          onDiscountChange={handleEditDiscountChange}
          onPriceChange={handleEditPriceChange}
          onStockChange={(val) => setEditingProduct((prev) => ({ ...prev, stockQty: val }))}
          isSaving={isUpdatingListing}
        />
      )}
    </VendorShell>
  );
}
