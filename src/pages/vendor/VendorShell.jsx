import Logo from "../../components/Logo";
import { OrdersIcon, PackageIcon, OverviewIcon, UserIcon, PlusIcon, MapPinIcon } from "./ui/icons";
import { cx } from "./ui/format";
import "./vendor.css";

const VENDOR_TABS = [
  { key: "orders", label: "Orders", icon: OrdersIcon },
  { key: "products", label: "Products", icon: PackageIcon },
  { key: "overview", label: "Overview", icon: OverviewIcon },
  { key: "profile", label: "Account", icon: UserIcon },
];

const initialOf = (name) => (name || "V").trim().charAt(0).toUpperCase();

function CountBadge({ count, className = "" }) {
  if (!count) return null;
  return (
    <span className={cx("inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold tabular-nums text-white", className)}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

// Vendor app frame: sidebar on desktop, top bar + bottom tabs on phones
export default function VendorShell({ shopName, ownerName, districtName, activeTab, onTabChange, activeOrdersCount, onAddProduct, overlays, children }) {
  const activeIndex = Math.max(0, VENDOR_TABS.findIndex((t) => t.key === activeTab));

  return (
    <div data-vendor-app className="min-h-dvh bg-slate-50 text-slate-900">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 px-5">
          <Logo size="sm" hideSubtitle />
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Partner</span>
        </div>

        <div className="mx-3 mb-4 rounded-xl border border-slate-200 px-3 py-3">
          <p className="truncate text-sm font-semibold text-slate-900" title={shopName}>{shopName}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
            {districtName}
          </p>
        </div>

        <nav aria-label="Main" className="relative flex-1 space-y-0.5 px-3">
          <span
            aria-hidden="true"
            className="absolute left-3 right-3 top-0 h-11 rounded-xl bg-slate-100 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `translateY(calc(${activeIndex} * (2.75rem + 0.125rem)))` }}
          />
          {VENDOR_TABS.map(({ key, label, icon: TabIcon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onTabChange(key)}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "relative z-10 flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-200 cursor-pointer",
                  active ? "text-slate-900" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <TabIcon className={cx("h-5 w-5 transition-colors duration-200", active ? "text-brand-600" : "text-slate-400")} strokeWidth={active ? 2 : 1.75} />
                <span className="flex-1 text-left">{label}</span>
                {key === "orders" && <CountBadge count={activeOrdersCount} />}
              </button>
            );
          })}
        </nav>

        <div className="p-3">
          <button
            type="button"
            onClick={onAddProduct}
            className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(154,52,18,0.25),inset_0_1px_0_rgba(255,255,255,0.12)] transition-[background-color,transform] hover:bg-brand-700 active:scale-[0.98] cursor-pointer"
          >
            <PlusIcon className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" strokeWidth={2.25} />
            Add product
          </button>
        </div>
      </aside>

      {/* Phone top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <div className="flex h-14 items-center gap-2.5 px-4">
          <Logo size="sm" iconOnly />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[15px] font-semibold text-slate-900">{shopName}</p>
            <p className="truncate text-xs text-slate-500">{districtName}</p>
          </div>
          <button
            type="button"
            onClick={() => onTabChange("profile")}
            aria-label="Account"
            className={cx(
              "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors cursor-pointer",
              activeTab === "profile" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            {initialOf(ownerName)}
          </button>
        </div>
      </header>

      <main className="md:pl-64">
        <div key={activeTab} className="vd-page mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:px-6 md:pb-12 md:pt-8 lg:px-8">{children}</div>
      </main>

      {overlays}

      {/* Phone bottom tabs */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="relative mx-auto grid max-w-lg grid-cols-4">
          <span aria-hidden="true" className="absolute top-0 left-0 flex h-0.5 w-1/4 justify-center transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ transform: `translateX(${activeIndex * 100}%)` }}>
            <span className="h-full w-10 rounded-full bg-brand-600" />
          </span>
          {VENDOR_TABS.map(({ key, label, icon: TabIcon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onTabChange(key)}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors cursor-pointer",
                  active ? "text-slate-900" : "text-slate-400 active:text-slate-600"
                )}
              >
                <span className={cx("relative transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]", active && "-translate-y-0.5")}>
                  <TabIcon className={cx("h-6 w-6 transition-colors duration-200", active && "text-brand-600")} strokeWidth={active ? 2 : 1.75} />
                  {key === "orders" && <CountBadge count={activeOrdersCount} className="absolute -right-3 -top-1.5 ring-2 ring-white" />}
                </span>
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
