import { getOrderView } from "../orderView";
import { ProductThumb, ProductRowSkeleton } from "./ProductsTab";
import WeeklyActivity from "./WeeklyActivity";
import { RupeeIcon, OrdersIcon, CheckIcon, PackageIcon, ChevronRightIcon, PhoneIcon, ChatIcon, BellIcon, MapPinIcon } from "../ui/icons";
import { Card, SectionTitle, StatusBadge, Button, EmptyState, CountUp } from "../ui/primitives";
import { inr, inrCompact, avatarTone, cx } from "../ui/format";

// Each figure keeps one colour across its icon chip and top edge
const STAT_TONES = {
  emerald: { chip: "bg-emerald-50 text-emerald-600 ring-emerald-600/15", edge: "bg-emerald-500", hover: "hover:border-emerald-200" },
  amber: { chip: "bg-amber-50 text-amber-600 ring-amber-600/15", edge: "bg-amber-400", hover: "hover:border-amber-200" },
  sky: { chip: "bg-sky-50 text-sky-600 ring-sky-600/15", edge: "bg-sky-500", hover: "hover:border-sky-200" },
  indigo: { chip: "bg-indigo-50 text-indigo-600 ring-indigo-600/15", edge: "bg-indigo-500", hover: "hover:border-indigo-200" },
};
import { SUPPORT_PHONE, SUPPORT_PHONE_DISPLAY, SUPPORT_WHATSAPP } from "../support";

function Stat({ icon: IconCmp, label, value, format, note, noteClass = "text-slate-500", onClick, index, tone = "sky" }) {
  const Tag = onClick ? "button" : "div";
  const t = STAT_TONES[tone];
  return (
    <Tag
      {...(onClick ? { type: "button", onClick } : {})}
      style={{ "--i": index }}
      className={cx(
        "group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left",
        onClick && `transition-[border-color,box-shadow,transform] duration-200 ${t.hover} hover:shadow-[0_12px_28px_-18px_rgba(15,23,42,0.25)] active:scale-[0.98] cursor-pointer`
      )}
    >
      <span className={cx("absolute inset-x-0 top-0 h-0.5", t.edge)} aria-hidden="true" />
      <div className="flex items-center gap-2 text-slate-500">
        <span className={cx("flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-inset", t.chip)}>
          <IconCmp className="h-4 w-4" />
        </span>
        <span className="flex-1 text-xs font-medium">{label}</span>
        {onClick && <ChevronRightIcon className="h-4 w-4 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-slate-500" />}
      </div>
      <p className="mt-2 truncate text-xl font-semibold tabular-nums tracking-tight text-slate-900 md:text-2xl">
        <CountUp value={value} format={format} />
      </p>
      {note && <p className={cx("mt-1 truncate text-xs", noteClass)}>{note}</p>}
    </Tag>
  );
}

const greetingFor = (hour) => (hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");

function LinkButton({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="group inline-flex h-8 items-center gap-0.5 rounded-lg px-2 -mr-2 text-sm font-medium text-sky-700 hover:bg-sky-50 hover:text-sky-800 cursor-pointer">
      {children}
      <ChevronRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
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
      <header className="vd-hero relative overflow-hidden rounded-2xl p-5 text-white shadow-[0_18px_40px_-24px_rgba(7,19,43,0.6)] md:rounded-3xl md:p-7">
        <span className="vd-blueprint absolute inset-0" aria-hidden="true" />
        <div className="relative">
          <p className="text-sm text-slate-300">
            {greetingFor(now.getHours())}, <span className="font-medium text-amber-300">{firstName}</span>
          </p>
          <h1 className="mt-1 line-clamp-2 text-2xl font-semibold leading-tight tracking-[-0.02em] text-white [text-wrap:balance] md:text-[32px]">{shopName}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-slate-400">
            <MapPinIcon className="h-4 w-4 text-brand-400" />
            {districtName}
            <span className="mx-1 h-1 w-1 rounded-full bg-slate-500" aria-hidden="true" />
            {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>

          {pendingOrdersCount > 0 && (
            <button
              type="button"
              onClick={onOpenPending}
              className="group mt-5 flex w-full items-center gap-3.5 rounded-xl border border-amber-300/25 bg-amber-400/10 px-3.5 py-3 text-left transition-[background-color,transform] duration-200 hover:bg-amber-400/15 active:scale-[0.99] cursor-pointer sm:max-w-md"
            >
              <span className="vd-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-navy-950">
                <BellIcon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-amber-100">
                  {pendingOrdersCount} {pendingOrdersCount === 1 ? "order is" : "orders are"} waiting for you
                </span>
                <span className="block text-xs text-slate-400">Respond quickly so customers can plan their site work</span>
              </span>
              <ChevronRightIcon className="h-5 w-5 shrink-0 text-amber-300/80 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
        <span className="vd-hairline absolute inset-x-0 bottom-0 h-[3px]" aria-hidden="true" />
      </header>

      <div className="vd-stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat index={0} tone="emerald" icon={RupeeIcon} label="Delivered revenue" value={totalRevenue} format={(n) => (n >= 1000000 ? inrCompact(n) : inr(n))} />
        <Stat
          index={1}
          tone="amber"
          icon={OrdersIcon}
          label="Active orders"
          value={activeOrdersCount}
          note={pendingOrdersCount > 0 ? `${pendingOrdersCount} awaiting response` : "All caught up"}
          noteClass={pendingOrdersCount > 0 ? "font-medium text-brand-700" : "text-emerald-600"}
          onClick={onOpenOrders}
        />
        <Stat index={2} tone="sky" icon={CheckIcon} label="Completed" value={completedOrdersCount} />
        <Stat
          index={3}
          tone="indigo"
          icon={PackageIcon}
          label="Products"
          value={vendorProducts.length}
          note={outOfStock > 0 ? `${outOfStock} out of stock` : `${liveCount} live`}
          noteClass={outOfStock > 0 ? "font-medium text-brand-700" : "text-emerald-600"}
          onClick={onOpenProducts}
        />
      </div>

      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="h-3.5 w-1 rounded-full bg-sky-500" aria-hidden="true" />
            Order activity
          </h2>
          <span className="text-xs text-slate-400">This week</span>
        </div>
        <WeeklyActivity orders={vendorOrders} />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle accent="bg-amber-400" action={vendorOrders.length > 0 && <LinkButton onClick={onOpenOrders}>All orders</LinkButton>}>Recent orders</SectionTitle>
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
                      <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold", avatarTone(view.customerName))} aria-hidden="true">
                        {view.customerName.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{view.customerName}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          <span title={view.time.full}>{view.time.short}</span> · {view.items.length} {view.items.length === 1 ? "item" : "items"}
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
          <SectionTitle accent="bg-indigo-500" action={vendorProducts.length > 0 && <LinkButton onClick={onOpenProducts}>All products</LinkButton>}>Your products</SectionTitle>
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
                        <p className={`mt-0.5 text-xs ${out ? "font-medium text-brand-700" : "text-emerald-600"}`}>
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

      <Card className="flex flex-col gap-3 border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 to-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-sm font-semibold text-emerald-950">Need help?</p>
          <p className="mt-0.5 text-sm text-slate-500">Talk to your district team · {SUPPORT_PHONE_DISPLAY}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button as="a" href={`tel:${SUPPORT_PHONE}`} variant="success" size="sm">
            <PhoneIcon className="h-4 w-4" />
            Call
          </Button>
          <Button as="a" href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer" variant="success" size="sm">
            <ChatIcon className="h-4 w-4" />
            WhatsApp
          </Button>
        </div>
      </Card>
    </div>
  );
}
