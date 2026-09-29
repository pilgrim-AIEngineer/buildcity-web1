// ye helper product ki category, name aur unit ke hisaab se sahi packaging packs generate karta hai
export function generateProductPacks(product) {
  if (!product) return [];

  const basePrice = Number(product.price) || 100;
  const baseMrp = Number(product.mrp) || Math.round(basePrice * 1.2);

  // Category aur name ko normalize karte hai taaki category ke hisaab se unit set ho sake
  const catRaw = (
    (typeof product.category === "string" ? product.category : product.category?.name) ||
    product.categoryName ||
    (typeof product.masterProduct?.category === "string" ? product.masterProduct?.category : product.masterProduct?.category?.name) ||
    product.masterProduct?.categoryName ||
    ""
  ).toLowerCase().trim();

  const nameLower = (product.name || "").toLowerCase().trim();
  const rawUnit = (product.unit || "").trim();
  const unitLower = rawUnit.toLowerCase();

  // Category detection logic
  const isPaint =
    catRaw.includes("paint") ||
    catRaw.includes("coating") ||
    catRaw.includes("primer") ||
    catRaw.includes("distemper") ||
    catRaw.includes("varnish") ||
    catRaw.includes("waterproof") ||
    nameLower.includes("paint") ||
    nameLower.includes("emulsion") ||
    nameLower.includes("apex") ||
    nameLower.includes("royale") ||
    nameLower.includes("distemper") ||
    nameLower.includes("primer") ||
    nameLower.includes("tractor") ||
    nameLower.includes("nerolac") ||
    nameLower.includes("berger") ||
    nameLower.includes("asian paints") ||
    nameLower.includes("dr fixit") ||
    nameLower.includes("thinner");

  const isCement =
    !isPaint &&
    (catRaw.includes("cement") ||
      catRaw.includes("putty") ||
      catRaw.includes("mortar") ||
      nameLower.includes("cement") ||
      nameLower.includes("ppc") ||
      nameLower.includes("opc") ||
      nameLower.includes("ultratech") ||
      nameLower.includes("ambuja") ||
      nameLower.includes("acc ") ||
      nameLower.includes("birla") ||
      nameLower.includes("jk super") ||
      unitLower.includes("bag") ||
      unitLower.includes("50 kg") ||
      unitLower.includes("50kg"));

  const isSteel =
    !isPaint &&
    !isCement &&
    (catRaw.includes("steel") ||
      catRaw.includes("rebar") ||
      catRaw.includes("tmt") ||
      catRaw.includes("iron") ||
      nameLower.includes("steel") ||
      nameLower.includes("tiscon") ||
      nameLower.includes("tmt") ||
      nameLower.includes("rebar") ||
      nameLower.includes("saria") ||
      nameLower.includes("kamdhenu") ||
      nameLower.includes("jindal"));

  const isTile =
    !isPaint &&
    !isCement &&
    !isSteel &&
    (catRaw.includes("tile") ||
      catRaw.includes("marble") ||
      catRaw.includes("granite") ||
      catRaw.includes("floor") ||
      nameLower.includes("tile") ||
      nameLower.includes("vitrified") ||
      nameLower.includes("ceramic"));

  const isAggregate =
    !isPaint &&
    !isCement &&
    !isSteel &&
    (catRaw.includes("stone") ||
      catRaw.includes("aggregate") ||
      catRaw.includes("sand") ||
      catRaw.includes("gitti") ||
      catRaw.includes("morang") ||
      nameLower.includes("sand") ||
      nameLower.includes("gitti") ||
      nameLower.includes("crushed stone") ||
      nameLower.includes("aggregate") ||
      nameLower.includes("balu") ||
      nameLower.includes("morang") ||
      nameLower.includes("bajri"));

  // Ab category ke hisaab se sahi unit aur 4 se 5 main packs set karte hai
  let cleanUnit = "Unit";
  let packMultipliers = [1, 5, 10, 20, 50];
  let customLabels = null;

  if (isPaint) {
    // Paint ke standard market packs: 1L, 4L, 10L, 20L
    cleanUnit = "1 Litre";
    packMultipliers = [1, 4, 10, 20];
    customLabels = {
      1: "1 Litre",
      4: "4 Litre (Bucket)",
      10: "10 Litre (Bucket)",
      20: "20 Litre (Drum)",
    };
  } else if (isCement) {
    // Cement aur Putty hamesha 50 kg Bag packaging me aate hai
    cleanUnit = "50 kg";
    packMultipliers = [1, 10, 20, 50, 100];
    customLabels = {
      1: "50 kg",
      10: "50 kg, Pack of 10",
      20: "50 kg, Pack of 20",
      50: "50 kg, Pack of 50",
      100: "50 kg, Pack of 100",
    };
  } else if (isSteel) {
    // Steel me ton ya rod/piece packs
    if (unitLower.includes("piece") || unitLower.includes("pc") || unitLower.includes("rod") || unitLower.includes("bar")) {
      cleanUnit = "1 Piece";
      packMultipliers = [1, 10, 25, 50, 100];
    } else {
      cleanUnit = "1 Ton";
      packMultipliers = [1, 2, 5, 10];
      customLabels = {
        1: "1 Ton",
        2: "2 Ton",
        5: "5 Ton",
        10: "10 Ton",
      };
    }
  } else if (isTile) {
    // Tiles Box me aati hai
    cleanUnit = "1 Box";
    packMultipliers = [1, 5, 10, 25, 50];
    customLabels = {
      1: "1 Box",
      5: "5 Boxes",
      10: "10 Boxes",
      25: "25 Boxes",
      50: "50 Boxes",
    };
  } else if (isAggregate) {
    if (unitLower.includes("cft")) {
      cleanUnit = "100 CFT";
      packMultipliers = [1, 2, 5, 10];
    } else {
      cleanUnit = "1 Ton";
      packMultipliers = [1, 2, 5, 10];
      customLabels = {
        1: "1 Ton",
        2: "2 Ton",
        5: "5 Ton",
        10: "10 Ton",
      };
    }
  } else {
    // Baaki general categories (Plumbing, Electrical, Hardware)
    if (unitLower.includes("litre") || unitLower.includes("ltr") || unitLower.includes("liter")) {
      cleanUnit = "1 Litre";
      packMultipliers = [1, 4, 10, 20];
    } else if (unitLower.includes("ton")) {
      cleanUnit = "1 Ton";
      packMultipliers = [1, 2, 5, 10];
    } else if (unitLower.includes("50 kg") || unitLower.includes("bag")) {
      cleanUnit = "50 kg";
      packMultipliers = [1, 10, 20, 50, 100];
    } else if (unitLower.includes("kg")) {
      cleanUnit = "1 Kg";
      packMultipliers = [1, 5, 10, 25, 50];
    } else if (unitLower.includes("bundle")) {
      cleanUnit = "1 Bundle";
      packMultipliers = [1, 3, 5, 10];
    } else {
      cleanUnit = rawUnit && rawUnit.toLowerCase() !== "unit" ? rawUnit : "1 Piece";
      packMultipliers = [1, 5, 10, 25, 50];
    }
  }

  return packMultipliers.map((qty) => {
    // Bulk discount logic: quantity badhne par extra discount rate
    let bulkDiscountRate = 0;
    if (isPaint) {
      if (qty >= 20) bulkDiscountRate = 0.06;
      else if (qty >= 10) bulkDiscountRate = 0.04;
      else if (qty >= 4) bulkDiscountRate = 0.02;
    } else if (isSteel || isAggregate) {
      if (qty >= 10) bulkDiscountRate = 0.05;
      else if (qty >= 5) bulkDiscountRate = 0.03;
      else if (qty >= 2) bulkDiscountRate = 0.015;
    } else {
      if (qty >= 100) bulkDiscountRate = 0.06;
      else if (qty >= 50) bulkDiscountRate = 0.04;
      else if (qty >= 20) bulkDiscountRate = 0.02;
      else if (qty >= 10) bulkDiscountRate = 0.01;
    }

    const unitDiscountedPrice = basePrice * (1 - bulkDiscountRate);
    const finalPrice = Math.round(unitDiscountedPrice * qty);
    const finalMrp = Math.round(baseMrp * qty);
    const savings = Math.max(0, finalMrp - finalPrice);
    const discountPct = Math.round(((finalMrp - finalPrice) / finalMrp) * 100);

    const label =
      customLabels && customLabels[qty]
        ? customLabels[qty]
        : qty === 1
        ? cleanUnit
        : `${cleanUnit}, Pack of ${qty}`;

    const isBulk = isPaint ? qty >= 10 : isSteel || isAggregate ? qty >= 5 : qty >= 20;

    return {
      qty,
      unitName: cleanUnit,
      label,
      price: finalPrice,
      mrp: finalMrp,
      savings,
      discountPct,
      perUnitPrice: Math.round(finalPrice / qty),
      isBulk,
    };
  });
}
