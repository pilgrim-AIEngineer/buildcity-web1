import { ProductThumb } from "./ProductsTab";
import { Sheet, Field, Button, ApprovalBadge, Spinner } from "../ui/primitives";
import { inr } from "../ui/format";

export default function EditListingSheet({ product, image, onClose, onSubmit, onMrpChange, onDiscountChange, onPriceChange, onStockChange, isSaving }) {
  if (!product) return null;

  const price = Number(product.price || 0);
  const mrp = Number(product.mrp || 0);
  const discount = Number(product.discountPct || 0);

  return (
    <Sheet
      open
      onClose={onClose}
      title={product.name}
      subtitle={[product.brand, product.unit].filter(Boolean).join(" · ")}
      leading={<ProductThumb src={image.src} fallback={image.fallback} alt="" className="h-10 w-10" />}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSaving} className="flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button type="submit" form="vendor-edit-listing" disabled={isSaving} className="flex-1">
            {isSaving ? (
              <>
                <Spinner />
                Saving
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      }
    >
      <form id="vendor-edit-listing" onSubmit={onSubmit} className="space-y-5 px-4 py-5 sm:px-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Listing status</span>
          <ApprovalBadge status={product.approvalStatus} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="MRP" prefix="₹" type="number" inputMode="numeric" required min="1" value={product.mrp || ""} onChange={(e) => onMrpChange(e.target.value)} />
          <Field label="Discount" suffix="%" type="number" inputMode="numeric" min="0" max="90" value={product.discountPct || 0} onChange={(e) => onDiscountChange(e.target.value)} />
          <Field label="Selling price" prefix="₹" type="number" inputMode="numeric" required min="1" value={product.price} onChange={(e) => onPriceChange(e.target.value)} />
          <Field label="Stock" type="number" inputMode="numeric" required min="0" value={product.stockQty} onChange={(e) => onStockChange(e.target.value)} />
        </div>

        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-white px-4 py-3 ring-1 ring-inset ring-emerald-200/70">
          <p className="text-xs font-medium text-emerald-700">Customers see</p>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="text-base font-semibold tabular-nums text-slate-900">{inr(price)}</span>
            <span className="text-slate-400">/ {product.unit || "unit"}</span>
            {mrp > price && <span className="tabular-nums text-slate-400 line-through">{inr(mrp)}</span>}
            {discount > 0 && (
              <span key={discount} className="vd-page rounded-md bg-emerald-600 px-1.5 py-0.5 text-xs font-semibold text-white">{discount}% off</span>
            )}
          </p>
        </div>
      </form>
    </Sheet>
  );
}
