import { useEffect, useRef } from "react";
import { ProductThumb } from "./ProductsTab";
import { CheckIcon, SearchIcon } from "../ui/icons";
import { Sheet, SearchField, Chip, ChipRow, Button, Field, EmptyState, Spinner } from "../ui/primitives";
import { cx, inr } from "../ui/format";

function OfferForm({ form, onSubmit, onCancel, isSubmitting }) {
  const { mrp, discountPct, sellingPrice, stockQty, onMrpChange, onDiscountChange, onSellingPriceChange, onStockChange } = form;
  const formRef = useRef(null);

  // Bring the price form into view when it opens
  useEffect(() => {
    const raf = requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <form
      onSubmit={onSubmit}
      ref={formRef}
      className="vd-page space-y-4 border-t border-brand-100 bg-brand-50/50 px-4 py-4 sm:px-5"
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="MRP" prefix="₹" type="number" inputMode="numeric" required min="1" placeholder="2500" value={mrp} onChange={(e) => onMrpChange(e.target.value)} />
        <Field label="Discount" suffix="%" type="number" inputMode="numeric" min="0" max="90" placeholder="10" value={discountPct} onChange={(e) => onDiscountChange(e.target.value)} />
        <Field label="Selling price" prefix="₹" type="number" inputMode="numeric" required min="1" placeholder="2250" value={sellingPrice} onChange={(e) => onSellingPriceChange(e.target.value)} />
        <Field label="Stock" type="number" inputMode="numeric" required min="1" placeholder="100" value={stockQty} onChange={(e) => onStockChange(e.target.value)} />
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-white px-3.5 py-2.5 text-sm ring-1 ring-inset ring-emerald-200/80">
        <span className="text-emerald-700">Customers see</span>
        <span className="font-semibold tabular-nums text-slate-900">{inr(sellingPrice)}</span>
        {Number(mrp) > Number(sellingPrice) && <span className="tabular-nums text-slate-400 line-through">{inr(mrp)}</span>}
        {Number(discountPct) > 0 && (
          <span key={discountPct} className="vd-page rounded-md bg-emerald-600 px-1.5 py-0.5 text-xs font-semibold text-white">{discountPct}% off</span>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1 sm:flex-none">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Spinner />
              Submitting
            </>
          ) : (
            "Submit for review"
          )}
        </Button>
      </div>
      <p className="text-xs text-slate-500">Goes live after your district team approves it.</p>
    </form>
  );
}

export default function CatalogSheet({
  open,
  onClose,
  totalCount,
  products,
  categories,
  categoryFilter,
  onCategoryFilterChange,
  search,
  onSearchChange,
  isInStore,
  selectedId,
  onToggleSelect,
  imageFor,
  form,
  onSubmit,
  isSubmitting,
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Add product" subtitle={`${totalCount} verified products in catalogue`} size="lg" fullHeightMobile hero>
      <div className="sticky top-0 z-10 space-y-3 border-b border-slate-100 bg-white px-4 py-3 sm:px-5">
        <SearchField value={search} onChange={onSearchChange} placeholder="Search brand, product or type" />
        <ChipRow>
          <Chip active={categoryFilter === "ALL"} onClick={() => onCategoryFilterChange("ALL")}>
            All
          </Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={categoryFilter === c.id} onClick={() => onCategoryFilterChange(c.id)}>
              {c.name}
            </Chip>
          ))}
        </ChipRow>
      </div>

      {products.length === 0 ? (
        <EmptyState icon={SearchIcon} title="No products found" description="Try another search or category." />
      ) : (
        <ul className="vd-stagger divide-y divide-slate-100 pb-[env(safe-area-inset-bottom)]">
          {products.map((mp, idx) => {
            const inStore = isInStore(mp);
            const selected = selectedId === mp.id;
            const img = imageFor(mp);
            const meta = [mp.brand, mp.grade, mp.unit].filter(Boolean).join(" · ");
            return (
              <li key={mp.id} id={`catalog-product-row-${mp.id}`} style={{ "--i": idx }} className={cx("transition-colors duration-300", selected && "bg-brand-50/40")}>
                <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <ProductThumb src={img.src} fallback={img.fallback} alt={mp.name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-slate-900">{mp.name}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {mp.brand && <span className="font-medium text-brand-700">{mp.brand}</span>}
                      {mp.brand ? meta.slice(String(mp.brand).length) : meta}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      MRP <span className="font-medium tabular-nums text-slate-700">{inr(mp.suggestedPrice)}</span>
                    </p>
                  </div>
                  {inStore ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/15">
                      <CheckIcon className="h-4 w-4" strokeWidth={2.25} />
                      Added
                    </span>
                  ) : (
                    <Button size="sm" variant={selected ? "secondary" : "primary"} onClick={() => onToggleSelect(mp)} aria-expanded={selected} className="shrink-0">
                      {selected ? "Close" : "Add"}
                    </Button>
                  )}
                </div>
                {selected && <OfferForm form={form} onSubmit={onSubmit} onCancel={() => onToggleSelect(mp)} isSubmitting={isSubmitting} />}
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}
