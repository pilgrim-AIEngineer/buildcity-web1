import { getOrderView } from "../orderView";
import { ProductThumb, ProductRowSkeleton } from "./ProductsTab";
import WeeklyActivity from "./WeeklyActivity";
import { RupeeIcon, OrdersIcon, CheckIcon, PackageIcon, ChevronRightIcon, PhoneIcon, ChatIcon, BellIcon, MapPinIcon } from "../ui/icons";
import { Card, SectionTitle, StatusBadge, Button, EmptyState, CountUp } from "../ui/primitives";
import { inr, inrCompact } from "../ui/format";
import { SUPPORT_PHONE, SUPPORT_PHONE_DISPLAY, SUPPORT_WHATSAPP } from "../support";

function Stat({ icon: IconCmp, label, value, format, note, onClick, index }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      {...(onClick ? { type: "button", onClick } : {})}
      style={{ "--i": index }}
      className={`group rounded-2xl border border-slate-200 bg-white p-4 text-left ${onClick ? "transition-[border-color,box-shadow,transform] duration-200 hover:border-slate-300 hover:shadow-[0_12px_28px_-18px_rgba(15,23,42,0.25)] active:scale-[0.98] cursor-pointer" : ""}`}
    >
      <div className="flex items-center gap-2 text-slate-500">
        <IconCmp className="h-4 w-4" />
        <span className="flex-1 text-xs font-medium">{label}</span>
        {onClick && <ChevronRightIcon className="h-4 w-4 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-slate-500" />}
      </div>
      <p className="mt-2 truncate text-xl font-semibold tabular-nums tracking-tight text-slate-900 md:text-2xl">
        <CountUp value={value} format={format} />
      </p>
      {note && <p className="mt-1 truncate text-xs text-slate-500">{note}</p>}
    </Tag>
  );
}

const greetingFor = (hour) => (hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");

function LinkButton({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-8 items-center gap-0.5 rounded-lg px-2 -mr-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer">
      {children}
      <ChevronRightIcon className="h-4 w-4" />
    </button>
  );
}

export default function OverviewTab({
  shopName,
  ownerName,
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
  onOpenOrder,
  onOpenProducts,
  onEditProduct,
  onAddProduct,
}) {
  const now = new Date();
  const firstName = String(ownerName || "").trim().split(/\s+/)[0] || "Partner";
  const liveCount = vendorProducts.filter((p) => p.approvalStatus !== "PENDING_REVIEW" && p.approvalStatus !== "REJECTED").length;
  const outOfStock = vendorProducts.filter((p) => !(Number(p.stockQty) > 0)).length;

  return (
    <div className="space-y-4 md:space-y-5">
      <header className="pb-1">
        <p className="text-sm text-slate-500">
          {greetingFor(now.getHours())}, {firstName}
        </p>
        <h1 className="mt-1 line-clamp-2 text-2xl font-semibold leading-tight tracking-[-0.02em] text-slate-900 [text-wrap:balance] md:text-[32px]">{shopName}</h1>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPinIcon className="h-4 w-4 text-slate-400" />
          {districtName}
          <span className="mx-1 h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
          {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </header>

      <div className="vd-stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat index={0} icon={RupeeIcon} label="Delivered revenue" value={totalRevenue} format={(n) => (n >= 1000000 ? inrCompact(n) : inr(n))} />
        <Stat
          index={1}
          icon={OrdersIcon}
          label="Active orders"
          value={activeOrdersCount}
          note={pendingOrdersCount > 0 ? `${pendingOrdersCount} awaiting response` : "All caught up"}
          onClick={onOpenOrders}
        />
        <Stat index={2} icon={CheckIcon} label="Completed" value={completedOrdersCount} />
        <Stat
          index={3}
          icon={PackageIcon}
          label="Products"
          value={vendorProducts.length}
          note={outOfStock > 0 ? `${outOfStock} out of stock` : `${liveCount} live`}
          onClick={onOpenProducts}
        />
      </div>

      {pendingOrdersCount > 0 && (
        <button
          type="button"
          onClick={onOpenPending}
          className="vd-page group flex w-full items-center gap-3.5 rounded-2xl bg-slate-900 px-4 py-3.5 text-left text-white transition-[background-color,transform] duration-200 hover:bg-slate-800 active:scale-[0.99] cursor-pointer sm:px-5"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
            <BellIcon className="h-5 w-5 text-brand-300" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">
              {pendingOrdersCount} {pendingOrdersCount === 1 ? "order is" : "orders are"} waiting for you
            </span>
            <span className="block text-xs text-slate-400">Respond quickly so customers can plan their site work</span>
          </span>
          <ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      )}

      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Order activity</h2>
          <span className="text-xs text-slate-400">This week</span>
        </div>
        <WeeklyActivity orders={vendorOrders} />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle action={vendorOrders.length > 0 && <LinkButton onClick={onOpenOrders}>All orders</LinkButton>}>Recent orders</SectionTitle>
          {vendorOrders.length === 0 ? (
            <EmptyState title="No orders yet" />
          ) : (
            <ul className="vd-stagger divide-y divide-slate-100 pb-1">
              {vendorOrders.slice(0, 5).map((ord, idx) => {
                const view = getOrderView(ord, districtName);
                return (
                  <li key={ord.id} style={{ "--i": idx }}>
                    <button
                      type="button"
                      onClick={() => onOpenOrder(ord)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 active:bg-slate-100 cursor-pointer sm:px-5"
                      >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600" aria-hidden="true">
                        {view.customerName.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("")}
                      </span>
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
                    </button>
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
            <ul className="vd-stagger divide-y divide-slate-100 pb-1">
              {vendorProducts.slice(0, 5).map((p, idx) => {
                const img = imageFor(p);
                const out = !(Number(p.stockQty) > 0);
                return (
                  <li key={p.id} style={{ "--i": idx }}>
                    <button
                      type="button"
                      onClick={() => onEditProduct(p)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50 cursor-pointer sm:px-5"
                    >
                      <ProductThumb src={img.src} fallback={img.fallback} alt={p.name} className="h-10 w-10" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                        <p className={`mt-0.5 text-xs ${out ? "font-medium text-brand-700" : "text-slate-500"}`}>
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
