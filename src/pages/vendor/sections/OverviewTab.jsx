import { getOrderView } from "../orderView";
import { ProductThumb, ProductRowSkeleton } from "./ProductsTab";
import { RupeeIcon, OrdersIcon, CheckIcon, PackageIcon, ChevronRightIcon, PhoneIcon, ChatIcon, ClockIcon } from "../ui/icons";
import { PageHeader, Card, SectionTitle, StatusBadge, Button, EmptyState } from "../ui/primitives";
import { inr } from "../ui/format";
import { SUPPORT_PHONE, SUPPORT_PHONE_DISPLAY, SUPPORT_WHATSAPP } from "../support";

function Stat({ icon: IconCmp, label, value, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      {...(onClick ? { type: "button", onClick } : {})}
      className={`rounded-2xl border border-slate-200 bg-white p-4 text-left ${onClick ? "transition-colors hover:border-slate-300 hover:bg-slate-50 cursor-pointer" : ""}`}
    >
      <div className="flex items-center gap-2 text-slate-500">
        <IconCmp className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 truncate text-xl font-semibold tabular-nums tracking-tight text-slate-900 md:text-2xl">{value}</p>
    </Tag>
  );
}

function LinkButton({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-8 items-center gap-0.5 rounded-lg px-2 -mr-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer">
      {children}
      <ChevronRightIcon className="h-4 w-4" />
    </button>
  );
}

export default function OverviewTab({
  districtName,
  totalRevenue,
  activeOrdersCount,
  pendingOrdersCount,
  completedOrdersCount,
  vendorOrders,
  vendorProducts,
  productsLoading,
  imageFor,
  onOpenOrders,
  onOpenPending,
  onOpenProducts,
  onEditProduct,
  onAddProduct,
}) {
  return (
    <div className="space-y-4">
      <PageHeader title="Overview" />

      {pendingOrdersCount > 0 && (
        <button
          type="button"
          onClick={onOpenPending}
          className="flex w-full items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-left transition-colors hover:bg-amber-100/70 cursor-pointer"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-amber-700 ring-1 ring-amber-200">
            <ClockIcon className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-amber-900">
              {pendingOrdersCount} {pendingOrdersCount === 1 ? "order needs" : "orders need"} your response
            </span>
            <span className="block text-xs text-amber-800/80">Accept to start processing</span>
          </span>
          <ChevronRightIcon className="h-5 w-5 shrink-0 text-amber-700" />
        </button>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={RupeeIcon} label="Delivered revenue" value={inr(totalRevenue)} />
        <Stat icon={OrdersIcon} label="Active orders" value={activeOrdersCount} onClick={onOpenOrders} />
        <Stat icon={CheckIcon} label="Completed" value={completedOrdersCount} />
        <Stat icon={PackageIcon} label="Products" value={vendorProducts.length} onClick={onOpenProducts} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle action={vendorOrders.length > 0 && <LinkButton onClick={onOpenOrders}>All orders</LinkButton>}>Recent orders</SectionTitle>
          {vendorOrders.length === 0 ? (
            <EmptyState title="No orders yet" />
          ) : (
            <ul className="divide-y divide-slate-100 pb-1">
              {vendorOrders.slice(0, 5).map((ord) => {
                const view = getOrderView(ord, districtName);
                return (
                  <li key={ord.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{view.customerName}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {view.shortId} · {view.placedAt}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-semibold tabular-nums text-slate-900">{inr(view.grandTotal)}</span>
                      <StatusBadge status={view.status} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle action={vendorProducts.length > 0 && <LinkButton onClick={onOpenProducts}>All products</LinkButton>}>Your products</SectionTitle>
          {productsLoading && vendorProducts.length === 0 ? (
            <div className="divide-y divide-slate-100">
              <ProductRowSkeleton />
              <ProductRowSkeleton />
            </div>
          ) : vendorProducts.length === 0 ? (
            <EmptyState title="No products yet" action={<Button size="sm" onClick={onAddProduct}>Add products</Button>} />
          ) : (
            <ul className="divide-y divide-slate-100 pb-1">
              {vendorProducts.slice(0, 5).map((p) => {
                const img = imageFor(p);
                const out = !(Number(p.stockQty) > 0);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => onEditProduct(p)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50 cursor-pointer sm:px-5"
                    >
                      <ProductThumb src={img.src} fallback={img.fallback} alt={p.name} className="h-10 w-10" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                        <p className={`mt-0.5 text-xs ${out ? "font-medium text-rose-600" : "text-slate-500"}`}>
                          {out ? "Out of stock" : `${Number(p.stockQty).toLocaleString("en-IN")} in stock`}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">{inr(p.price)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-sm font-semibold text-slate-900">Need help?</p>
          <p className="mt-0.5 text-sm text-slate-500">Talk to your district team · {SUPPORT_PHONE_DISPLAY}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button as="a" href={`tel:${SUPPORT_PHONE}`} variant="secondary" size="sm">
            <PhoneIcon className="h-4 w-4" />
            Call
          </Button>
          <Button as="a" href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm">
            <ChatIcon className="h-4 w-4" />
            WhatsApp
          </Button>
        </div>
      </Card>
    </div>
  );
}
