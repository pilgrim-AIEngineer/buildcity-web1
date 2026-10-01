import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import ProductCard from "../../components/ProductCard";
import ProductImageSlider, { getProductImages } from "../../components/ProductImageSlider";
import { useCart } from "../../context/CartContext";
import { useRegion } from "../../context/RegionContext";
import { useAdmin } from "../../context/AdminContext";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../config/api";
import { authFetch } from "../../config/authFetch";
import { generateProductPacks } from "../../utils/productPacks";

// Agar context me product na mile toh local fallback data
function generateProduct(id, priceFactor = 1, regionName = "Varanasi") {
  const decoded = decodeURIComponent(id || "");
  const hasSpaceOrWord = decoded.includes(" ") || (decoded.length > 15 && !/^[a-f0-9-]+$/i.test(decoded));
  const displayName = hasSpaceOrWord
    ? decoded
    : "UltraTech Super PPC Cement";

  const brand = "BuildCity Certified";
  const baseMrp = 390;
  const mrp = Math.round(baseMrp * priceFactor);
  const discount = Math.round(mrp * 0.15);

  let detectedCategory = "Cement";
  let detectedUnit = "50 kg";
  const lowerName = displayName.toLowerCase();
  if (/paint|primer|emulsion|distemper|royale|apex|nerolac|berger/i.test(lowerName)) {
    detectedCategory = "Paints";
    detectedUnit = "1 Litre";
  } else if (/steel|tmt|rebar|iron|tiscon|kamdhenu/i.test(lowerName)) {
    detectedCategory = "Steel";
    detectedUnit = "1 Ton";
  } else if (/tile|marble|granite/i.test(lowerName)) {
    detectedCategory = "Tiles";
    detectedUnit = "1 Box";
  } else if (/pipe|plumb/i.test(lowerName)) {
    detectedCategory = "Plumbing";
    detectedUnit = "1 Piece";
  }

  return {
    id,
    name: displayName,
    brand,
    category: detectedCategory,
    images: [
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
    ],
    mrp,
    price: mrp - discount,
    rating: 5.0,
    reviews: 0,
    inStock: true,
    unit: detectedUnit,
    description: `High-quality certified construction material. Supplied directly via BuildCity Certified Delivery Network across ${regionName}.`,
    specs: [
      { label: "Brand", value: brand },
      { label: "Category", value: "Building Supplies" },
      { label: "Unit Packaging", value: "50kg Bag" },
      { label: "Warranty", value: "Manufacturer Warranty" },
      { label: "Delivery", value: "Fast Site Delivery" },
    ],
    vendorId: `v-${id}`,
    vendorName: "BuildCity Direct",
    reviewsList: [],
  };
}

const DEMO_NAMES = new Set([
  "rahul singh",
  "vikram malhotra",
  "amit sharma",
  "rahul s.",
  "vikram m.",
  "amit s.",
  "priya v.",
  "rakesh k.",
  "priya verma",
  "rakesh kumar"
]);

function filterOutDemoReviews(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((r) => {
    if (!r || !r.name) return false;
    const nameLower = r.name.toLowerCase().trim();
    return !DEMO_NAMES.has(nameLower);
  });
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const userRole = String(user?.role || "").toLowerCase();
  const isPartner = ["admin", "dr", "district_rep", "vendor"].includes(userRole) || Boolean(user?.drInfo) || Boolean(user?.vendorInfo);
  const isCustomer = Boolean(user && !isPartner);
  const { addItem } = useCart();
  const { region } = useRegion();
  const { products = [], masterProducts = [], vendors = [], productsLoading } = useAdmin();

  const [directProduct, setDirectProduct] = useState(null);
  const [directLoading, setDirectLoading] = useState(false);

  // Cloud API se direct product fetch karne ka fallback effect
  useEffect(() => {
    const decodedId = decodeURIComponent(id || "").trim();
    const existing = products.find(
      (p) =>
        p.id === id ||
        p.id === decodedId ||
        (p.name && p.name.toLowerCase() === decodedId.toLowerCase()) ||
        (p.name && encodeURIComponent(p.name) === id)
    );

    if (!existing) {
      setDirectLoading(true);
      authFetch(`${API_BASE_URL}/api/v1/vendor/listings`)
        .then((r) => r.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : (data?.listings || []);
          const found = list.find(
            (l) =>
              l.id === id ||
              l.id === decodedId ||
              (l.name && l.name.toLowerCase() === decodedId.toLowerCase()) ||
              (l.name && encodeURIComponent(l.name) === id)
          );
          if (found) {
            const isSusp = found.isVendorSuspended || found.vendor?.status === "SUSPENDED" || found.isActive === false;
            setDirectProduct({ ...found, isVendorSuspended: Boolean(isSusp) });
          }
          setDirectLoading(false);
        })
        .catch(() => setDirectLoading(false));
    } else {
      setDirectProduct(null);
    }
  }, [id, products]);

  const [syncTick, setSyncTick] = useState(0);

  // Vendor dwara lot price ya discount badalne par customer page turant bina reload ke sync hoga
  useEffect(() => {
    const handleSync = () => setSyncTick((t) => t + 1);
    window.addEventListener("buildcity_products_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("buildcity_products_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const product = useMemo(() => {
    const decodedId = decodeURIComponent(id || "").trim();
    const realProd =
      products.find(
        (p) =>
          p.id === id ||
          p.id === decodedId ||
          (p.name && p.name.toLowerCase() === decodedId.toLowerCase()) ||
          (p.name && encodeURIComponent(p.name) === id)
      ) || directProduct;

    if (realProd) {
      const price = Number(realProd.price) || 100;
      let resolvedMrp = Number(realProd.mrp || 0);
      if (resolvedMrp <= 0) {
        try {
          const storedMrps = JSON.parse(localStorage.getItem("buildcity_listing_mrps") || "{}");
          if (storedMrps[realProd.id] && Number(storedMrps[realProd.id]) > 0) {
            resolvedMrp = Number(storedMrps[realProd.id]);
          }
        } catch {}
      }
      const mrp = resolvedMrp > 0
        ? resolvedMrp
        : (realProd.masterProduct?.mrp ? Number(realProd.masterProduct.mrp) : realProd.masterProduct?.suggestedPrice ? Math.max(Number(realProd.masterProduct.suggestedPrice), price) : Math.round(price * 1.2));

      const extractedImages = getProductImages(realProd);
      const isSuspended =
        realProd.isVendorSuspended === true ||
        realProd.vendor?.status === "SUSPENDED" ||
        realProd.isActive === false;
      const resolvedCategory =
        (typeof realProd.category === "string" ? realProd.category : realProd.category?.name) ||
        realProd.categoryName ||
        (typeof realProd.masterProduct?.category === "string" ? realProd.masterProduct?.category : realProd.masterProduct?.category?.name) ||
        realProd.masterProduct?.categoryName ||
        "";

      return {
        id: realProd.id,
        name: realProd.name,
        brand: realProd.brand || "Generic",
        category: resolvedCategory || "Material",
        vendorId: realProd.vendorId,
        vendorName: realProd.vendorName || realProd.vendor?.shopName,
        isVendorSuspended: isSuspended,
        images: extractedImages,
        mrp,
        price: Number(realProd.price) || 100,
        rating: 5.0,
        reviews: 0,
        inStock: (realProd.stockQty || 0) > 0 && !isSuspended,
        unit: realProd.unit || "Unit",
        customPacks: (() => {
          let cp = realProd.customPacks || realProd.custom_packs;
          if (typeof cp === "string") {
            try { cp = JSON.parse(cp); } catch {}
          }
          if (Array.isArray(cp) && cp.length > 0) return cp;
          try {
            const stored = JSON.parse(localStorage.getItem("buildcity_custom_packs") || "{}");
            if (Array.isArray(stored[realProd.id]) && stored[realProd.id].length > 0) {
              return stored[realProd.id];
            }
          } catch {}
          return realProd.masterProduct?.customPacks || null;
        })(),
        description:
          (realProd.description && realProd.description.trim()) ||
          (realProd.masterProduct?.description && realProd.masterProduct.description.trim()) ||
          (masterProducts.find((m) => m.id === realProd.masterProductId || m.id === realProd.id || (m.name && realProd.name && m.name.toLowerCase() === realProd.name.toLowerCase()))?.description) ||
          `High-quality certified ${realProd.name} by ${realProd.brand || "Authorized Brand"}. Supplied directly via BuildCity Certified Delivery Network.`,
        specs: [
          { label: "Fulfillment", value: "BuildCity Certified Network" },
          { label: "Brand", value: realProd.brand || "Generic" },
          { label: "Grade", value: realProd.grade || "Standard" },
          { label: "Type", value: realProd.type || "Standard Type" },
          { label: "Packaging Unit", value: realProd.unit || "Unit" },
          { label: "Available Stock", value: `${realProd.stockQty || 100} units` },
        ],
        reviewsList: [],
      };
    }
    return generateProduct(id, region.priceFactor, region.name);
  }, [id, products, masterProducts, directProduct, region, syncTick]);

  // Check kar rahe hain ki vendor suspend toh nahi hai
  const isVendorSuspended = useMemo(() => {
    if (!product) return false;
    if (product.isVendorSuspended) return true;
    if (product.vendorId && Array.isArray(vendors) && vendors.length > 0) {
      const v = vendors.find(
        (v) => String(v.id).toLowerCase() === String(product.vendorId).toLowerCase()
      );
      if (v && v.status === "SUSPENDED") return true;
    }
    return false;
  }, [product, vendors]);

  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  // Rule-based automatic packs calculate karte hai
  const packs = useMemo(() => generateProductPacks(product), [product]);
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);

  // Jab product badle toh pehla pack select karo
  useEffect(() => {
    setSelectedPackIndex(0);
  }, [product?.id]);

  const selectedPack = packs[selectedPackIndex] || packs[0];
  const currentPrice = selectedPack ? selectedPack.price : (product?.price || 0);
  const currentMrp = selectedPack ? selectedPack.mrp : (product?.mrp || 0);

  // Jab product badle toh page top par smoothly scroll karo
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  // Similar Products / Recommended Alternatives matching logic
  const similarProducts = useMemo(() => {
    if (!product) return [];

    const currentCat = String(
      (typeof product.category === "string" ? product.category : product.category?.name) ||
      product.categoryName ||
      ""
    ).toLowerCase().trim();

    const currentId = String(product.id || id || "").toLowerCase().trim();
    const currentName = String(product.name || "").toLowerCase().trim();

    const result = [];
    const seenIds = new Set([currentId]);
    if (id) seenIds.add(String(id).toLowerCase().trim());

    // 1. Pehle live vendor listings me se same category ke active products dhoondo
    if (Array.isArray(products) && products.length > 0) {
      const candidates = products.filter((p) => {
        if (!p || p.isActive === false) return false;
        if (p.isVendorSuspended || p.vendor?.status === "SUSPENDED") return false;
        const pId = String(p.id || "").toLowerCase().trim();
        if (seenIds.has(pId)) return false;
        if (currentName && String(p.name || "").toLowerCase().trim() === currentName) return false;

        const pCat = String(
          (typeof p.category === "string" ? p.category : p.category?.name) ||
          p.categoryName ||
          p.masterProduct?.categoryName ||
          ""
        ).toLowerCase().trim();

        if (!currentCat || !pCat) return false;
        return pCat === currentCat || pCat.includes(currentCat) || currentCat.includes(pCat);
      });

      // Sort: different brand ko thoda priority do taaki ACC, Ambuja, etc. variety dikhe
      candidates.sort((a, b) => {
        const aDiffBrand = a.brand && product.brand && a.brand.toLowerCase() !== product.brand.toLowerCase();
        const bDiffBrand = b.brand && product.brand && b.brand.toLowerCase() !== product.brand.toLowerCase();
        if (aDiffBrand && !bDiffBrand) return -1;
        if (!aDiffBrand && bDiffBrand) return 1;
        return (Number(b.stockQty) || 0) - (Number(a.stockQty) || 0);
      });

      candidates.slice(0, 4).forEach((p) => {
        seenIds.add(String(p.id || "").toLowerCase().trim());
        result.push(p);
      });
    }

    // 2. Agar live vendor listings me 4 se kam hain, toh masterProducts catalog se fill karo
    if (result.length < 4 && Array.isArray(masterProducts) && masterProducts.length > 0) {
      const masterCandidates = masterProducts.filter((mp) => {
        if (!mp) return false;
        const mpId = String(mp.id || "").toLowerCase().trim();
        if (seenIds.has(mpId)) return false;
        if (currentName && String(mp.name || "").toLowerCase().trim() === currentName) return false;

        const mpCat = String(
          (typeof mp.category === "string" ? mp.category : mp.category?.name) ||
          mp.categoryName ||
          ""
        ).toLowerCase().trim();

        if (!currentCat || !mpCat) return false;
        return mpCat === currentCat || mpCat.includes(currentCat) || currentCat.includes(mpCat);
      });

      masterCandidates.forEach((mp) => {
        if (result.length >= 4) return;
        seenIds.add(String(mp.id || "").toLowerCase().trim());
        result.push({
          id: mp.id,
          name: mp.name,
          brand: mp.brand || "BuildCity Certified",
          category: mp.categoryName || product.category || "Building Materials",
          imageUrl: mp.imageUrl || mp.image,
          price: Number(mp.suggestedPrice || mp.mrp || 100),
          mrp: Number(mp.mrp || Math.round((Number(mp.suggestedPrice) || 100) * 1.2)),
          unit: mp.unit || "Unit",
          inStock: true,
        });
      });
    }

    return result.slice(0, 4);
  }, [product, id, products, masterProducts]);

  const targetProductId = useMemo(() => {
    return String(product?.id || id || "").trim();
  }, [product?.id, id]);

  // Product ke customer reviews ka state aur database sync
  const [reviewsList, setReviewsList] = useState(() => {
    try {
      const saved = localStorage.getItem(`buildcity_reviews_${id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const clean = filterOutDemoReviews(parsed);
        return clean;
      }
    } catch (err) {}
    return [];
  });

  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerName, setReviewerName] = useState(user?.name || "");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Product ID badalane par reviews reset aur sync karo
  useEffect(() => {
    if (!targetProductId) return;
    try {
      const saved = localStorage.getItem(`buildcity_reviews_${targetProductId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const clean = filterOutDemoReviews(parsed);
        setReviewsList(clean);
        return;
      }
    } catch (e) {}
    setReviewsList([]);
  }, [targetProductId]);

  useEffect(() => {
    if (user?.name && !reviewerName) {
      setReviewerName(user.name);
    }
  }, [user]);

  // Backend API se live reviews fetch karne ka function
  useEffect(() => {
    if (!targetProductId) return;
    let isMounted = true;
    authFetch(`${API_BASE_URL}/api/v1/reviews?productId=${encodeURIComponent(targetProductId)}`)
      .then((res) => {
        if (!res.ok) throw new Error("API status " + res.status);
        return res.json();
      })
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          const cleanData = filterOutDemoReviews(data);
          setReviewsList(cleanData);
          try {
            localStorage.setItem(`buildcity_reviews_${targetProductId}`, JSON.stringify(cleanData));
          } catch (e) {}
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch live DB reviews, keeping local state:", err);
      });
    return () => {
      isMounted = false;
    };
  }, [targetProductId]);

  // Average star rating aur total reviews live calculate karna
  const avgRating = useMemo(() => {
    if (!reviewsList || reviewsList.length === 0) return 5.0;
    const sum = reviewsList.reduce((acc, r) => acc + Number(r.rating || 5), 0);
    return (sum / reviewsList.length).toFixed(1);
  }, [reviewsList]);

  const currentDiscountPct = selectedPack
    ? selectedPack.discountPct
    : Math.round(((product.mrp - product.price) / product.mrp) * 100);

  const handleAddToCart = () => {
    const isCustomPack = selectedPack && selectedPack.qty > 1;
    addItem(
      {
        id: isCustomPack ? `${product.id}-pack-${selectedPack.qty}` : product.id,
        name: isCustomPack ? `${product.name} (${selectedPack.label})` : product.name,
        brand: product.brand,
        img: product.images?.[0] || product.image,
        price: selectedPack ? selectedPack.price : product.price,
        basePrice: selectedPack ? selectedPack.price : product.price,
        mrp: selectedPack ? selectedPack.mrp : product.mrp,
        packLabel: selectedPack ? selectedPack.label : null,
        packQty: selectedPack ? selectedPack.qty : 1,
        unit: selectedPack ? selectedPack.unitName : product.unit,
        vendorId: product.vendorId,
        vendorName: product.vendorName,
      },
      qty
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/checkout");
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    setReviewError("");

    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    if (isPartner) {
      setReviewError("Only customer accounts can submit reviews. Admin, DR, and Vendor accounts cannot post reviews.");
      return;
    }

    if (!reviewComment.trim()) {
      setReviewError("Please enter your review comments.");
      return;
    }

    const nameToUse = reviewerName.trim() || user?.name || "Verified Customer";
    setIsSubmittingReview(true);

    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: targetProductId,
          name: nameToUse,
          rating: Number(newRating),
          comment: reviewComment.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review to database.");
      }

      // Review successfully saved in Database!
      setReviewsList((prev) => {
        const updated = [data, ...prev.filter((r) => r.id !== data.id && r.comment !== data.comment)];
        try {
          localStorage.setItem(`buildcity_reviews_${targetProductId}`, JSON.stringify(updated));
        } catch (err) {}
        return updated;
      });

      setReviewComment("");
      setReviewSubmitted(true);
      setShowForm(false);
      setTimeout(() => setReviewSubmitted(false), 4000);
    } catch (err) {
      setReviewError(err.message || "Failed to save review to database. Please check your connection and try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if ((productsLoading && directLoading) || (!product && directLoading)) {
    return (
      <div className="min-h-screen bg-surface pb-20 font-sans">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <span className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></span>
            <p className="text-xs font-bold text-slate-500">Loading Product...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-20 font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="text-xs text-slate-400 mb-4">
          <Link to="/" className="hover:text-brand-500">Home</Link>
          <span className="mx-1.5">/</span>
          <Link to={`/categories?cat=${encodeURIComponent(product.category)}`} className="hover:text-brand-500 capitalize">
            {product.category}
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-slate-500">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Product images ka slider */}
          <div>
            <ProductImageSlider images={product.images} name={product.name} />
          </div>

          {/* Product details aur pricing block */}
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">{product.brand}</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-navy-900 mt-1 mb-2 leading-snug tracking-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-lg shadow-2xs">
                {avgRating} <StarIcon />
              </span>
              <span className="text-xs font-semibold text-slate-500">
                ({reviewsList.length} Customer Reviews)
              </span>
            </div>

            <div className="flex items-baseline gap-2.5 mb-1">
              <span className="text-2xl font-black text-navy-900 tracking-tight">
                ₹{Number(currentPrice || 0).toLocaleString("en-IN")}
              </span>
              {currentMrp > currentPrice && (
                <span className="text-xs text-slate-400 line-through font-medium">
                  ₹{Number(currentMrp || 0).toLocaleString("en-IN")}
                </span>
              )}
              {currentDiscountPct > 0 && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {currentDiscountPct}% OFF
                </span>
              )}
            </div>

            <div className="mb-5">
              {isVendorSuspended ? (
                <span className="text-xs font-extrabold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 inline-block shadow-2xs">
                  Unavailable
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  In Stock — Ready for site delivery
                </span>
              )}
            </div>

            {/* Pack ya quantity aur unit selector - mobile first grid layout */}
            {packs && packs.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-extrabold text-navy-900 uppercase tracking-wider">
                    Size: <span className="text-brand-600 font-black normal-case">{selectedPack?.label}</span>
                  </span>
                  {selectedPack?.qty > 1 && selectedPack?.perUnitPrice && (
                    <span className="text-[11px] font-semibold text-slate-500">
                      (₹{selectedPack.perUnitPrice.toLocaleString("en-IN")} / {selectedPack.unitName})
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3">
                  {packs.map((pk, idx) => {
                    const isSelected = idx === selectedPackIndex;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPackIndex(idx)}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer relative ${
                          isSelected
                            ? "border-sky-600 bg-sky-50/80 shadow-xs ring-1 ring-sky-500"
                            : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50 shadow-2xs"
                        }`}
                      >
                        {pk.isBulk && (
                          <span className="absolute -top-2 right-1.5 text-[9px] font-black uppercase tracking-wider bg-emerald-700 text-white px-1.5 py-0.2 rounded-full shadow-2xs">
                            Bulk
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-800 leading-tight mb-1">
                          {pk.label}
                        </span>
                        <div className="w-full border-t border-slate-200/80 my-1" />
                        <div className="flex items-baseline justify-center gap-1.5">
                          <span className="text-xs font-black text-navy-900">
                            ₹{pk.price.toLocaleString("en-IN")}
                          </span>
                          {pk.mrp > pk.price && (
                            <span className="text-[10px] text-slate-400 line-through">
                              ₹{pk.mrp.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                        {pk.discountPct > 0 && (
                          <span className="text-[10px] font-bold text-emerald-700 mt-0.5">
                            {pk.discountPct}% OFF
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity select karne ka counter */}
            <div className="flex items-center gap-4 mb-5">
              <span className="text-xs font-bold text-navy-900">Quantity</span>
              <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-2xs">
                <button
                  type="button"
                  disabled={isVendorSuspended}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-l-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  −
                </button>
                <span className="px-4 text-xs font-extrabold text-navy-900">{qty}</span>
                <button
                  type="button"
                  disabled={isVendorSuspended}
                  onClick={() => setQty((q) => q + 1)}
                  className="px-3.5 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-r-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-3 mb-8">
              {isVendorSuspended ? (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-xl py-3 text-xs font-extrabold bg-slate-200 text-slate-600 border border-slate-300 cursor-not-allowed opacity-80"
                >
                  Unavailable
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={`flex-1 rounded-xl py-3 text-xs font-bold border transition-all active:scale-[0.98] cursor-pointer shadow-xs ${
                      justAdded
                        ? "border-emerald-500 text-emerald-700 bg-emerald-50 font-black"
                        : "border-brand-500 text-brand-600 hover:bg-brand-500 hover:text-white"
                    }`}
                  >
                    {justAdded ? "Added to Cart ✓" : "Add to Cart"}
                  </button>
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="flex-1 rounded-xl py-3 text-xs font-extrabold bg-brand-500 text-white hover:bg-brand-600 shadow-md active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Buy Now
                  </button>
                </>
              )}
            </div>

            {/* Product ka description */}
            <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <h3 className="text-xs font-extrabold text-navy-900 uppercase tracking-wider mb-1.5">Description</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {product.description}
              </p>
            </div>

            {/* Technical specifications details */}
            <div>
              <h3 className="text-xs font-extrabold text-navy-900 uppercase tracking-wider mb-2">Specifications</h3>
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                {product.specs.map((s, i) => (
                  <div
                    key={s.label}
                    className={`flex text-xs px-4 py-2.5 ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/70"
                    }`}
                  >
                    <span className="w-1/3 text-slate-500 font-medium">{s.label}</span>
                    <span className="flex-1 text-navy-900 font-bold">
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products / Recommended Alternatives */}
        {similarProducts.length > 0 && (
          <section className="mt-12 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-navy-900 tracking-tight">
                    Similar Products
                  </h2>
                  
                </div>
             
              </div>
              <Link
                to={`/categories?cat=${encodeURIComponent(product.category || "")}`}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group transition-colors"
              >
                <span>View all in category</span>
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
              {similarProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Customer reviews aur ratings section */}
        <section className="mt-12 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-navy-900 tracking-tight">
                  Customer Reviews
                </h2>
                <span className="bg-emerald-50 text-emerald-700 font-extrabold text-xs px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  ⭐ {avgRating} / 5.0
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Verified customer ratings & real site experiences.</p>
            </div>

            {!user ? (
              <button
                type="button"
                onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)}
                className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <span>🔑</span> Login to Write a Review
              </button>
            ) : isPartner ? (
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200/90 px-3 py-1.5 rounded-xl shrink-0">
                Customer Review Only
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setReviewError("");
                  setShowForm((v) => !v);
                }}
                className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer shrink-0"
              >
                {showForm ? "✕ Close Form" : "✍️ Write a Review"}
              </button>
            )}
          </div>

          {/* Notice if logged in as admin/dr/vendor */}
          {isPartner && (
            <div className="mb-6 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium flex items-center gap-2">
              <span className="text-sm">ℹ️</span>
              <span>
                You are logged in as <strong>{userRole.toUpperCase()}</strong>. Product reviews can only be submitted by verified customer accounts.
              </span>
            </div>
          )}

          {/* Review submit hone par success alert */}
          {reviewSubmitted && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <span>Thank you! Your review has been published and saved to the database successfully.</span>
            </div>
          )}

          {/* Review submit error alert */}
          {reviewError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <span>⚠️</span>
              <span>{reviewError}</span>
            </div>
          )}

          {/* Naya review likhne ka form */}
          {showForm && isCustomer && (
            <form onSubmit={handleAddReview} className="mb-8 p-5 bg-brand-50/40 border border-brand-200/60 rounded-2xl space-y-4">
              <h3 className="font-extrabold text-navy-900 text-sm">Write Your Product Review</h3>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1.5">Select Rating *</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setNewRating(star)}
                      className="text-2xl transition-transform hover:scale-110 cursor-pointer p-0.5"
                    >
                      <span className={(hoverRating || newRating) >= star ? "text-emerald-500" : "text-slate-300"}>
                        ★
                      </span>
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-navy-900">
                    {newRating} / 5 Stars
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="w-full bg-white text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none font-bold focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">Review Comments *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Share your experience with product quality, packaging, and site delivery..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full bg-white text-xs border border-slate-200 rounded-xl p-3 outline-none font-medium focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setReviewError("");
                    setShowForm(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-500 rounded-xl shadow-xs hover:bg-brand-600 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingReview ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Saving...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Sabhi submitted reviews ki list */}
          {reviewsList.length === 0 ? (
            <div className="py-8 px-4 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center">
              <span className="text-3xl mb-2">⭐</span>
              <h4 className="text-xs font-black text-navy-900 mb-1">No Customer Reviews Yet</h4>
              <p className="text-[11px] text-slate-500 max-w-sm mb-3">Be the first verified customer to share your experience with this product!</p>
              {!showForm && (
                !user ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)}
                    className="bg-navy-900 hover:bg-brand-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    🔑 Login to Write First Review
                  </button>
                ) : isCustomer ? (
                  <button
                    type="button"
                    onClick={() => {
                      setReviewError("");
                      setShowForm(true);
                    }}
                    className="bg-navy-900 hover:bg-brand-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    ✍️ Write the First Review
                  </button>
                ) : null
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reviewsList.map((r) => (
                <div
                  key={r.id || r.name}
                  className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-navy-900">
                        {r.name}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        ★ {r.rating}.0
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{r.comment}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 font-medium">
                    Verified Buyer · {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : (r.date || "Recent")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z" />
    </svg>
  );
}