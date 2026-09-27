// Image resolvers for vendor product / category tiles — bundled offline assets first, zero-latency fallbacks

const bundledAssetFor = (categoryName = "", productName = "") => {
  const cat = (categoryName || "").toLowerCase();
  const name = (productName || "").toLowerCase();

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

export const resolveProductImage = (imageUrl, categoryName = "", productName = "") => {
  if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
    return bundledAssetFor(categoryName, productName);
  }
  // Already a local asset
  if (imageUrl.startsWith("/") || imageUrl.startsWith("assets/")) {
    return imageUrl;
  }
  // Unsplash: request a small thumbnail so it loads fast
  if (imageUrl.includes("images.unsplash.com")) {
    const base = imageUrl.split("?")[0];
    return `${base}?auto=format&fit=crop&w=300&h=300&q=80`;
  }
  return imageUrl;
};

// Category bubble image resolver matching circular category tiles
export const resolveCategoryBubbleImage = (catName = "") => {
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

// Listed product image, falling back to its master-catalog image
export const listingImage = (p, masterProducts = []) =>
  resolveProductImage(
    p.imageUrl || masterProducts.find((m) => m.id === p.masterProductId)?.imageUrl,
    p.categoryName,
    p.name
  );

