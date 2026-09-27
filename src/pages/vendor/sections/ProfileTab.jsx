import { BadgeCheckIcon, PhoneIcon, ChatIcon, ChevronRightIcon, LogOutIcon, StoreIcon, UserIcon, MailIcon, MapPinIcon } from "../ui/icons";
import { PageHeader, Card } from "../ui/primitives";
import { SUPPORT_PHONE, SUPPORT_PHONE_DISPLAY, SUPPORT_WHATSAPP } from "../support";

function DetailRow({ icon: IconCmp, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
      <IconCmp className="h-5 w-5 shrink-0 text-slate-400" />
      <span className="w-28 shrink-0 text-sm text-slate-500">{label}</span>
      <span className="min-w-0 flex-1 truncate text-right text-sm font-medium text-slate-900 sm:text-left">{value}</span>
    </div>
  );
}

function ActionRow({ icon: IconCmp, label, detail, ...linkProps }) {
  return (
    <a {...linkProps} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50 active:bg-slate-100 sm:px-5">
      <IconCmp className="h-5 w-5 shrink-0 text-slate-400" />
      <span className="flex-1 text-sm font-medium text-slate-900">{label}</span>
      {detail && <span className="text-sm text-slate-500">{detail}</span>}
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
    </a>
  );
}

export default function ProfileTab({ ownerName, shopName, vendorPhone, email, districtName, onLogout }) {
  return (
    <div className="space-y-4 md:max-w-2xl">
      <PageHeader title="Account" />

      <Card className="flex items-center gap-4 p-4 sm:p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white">
          {(ownerName || "V").trim().charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">{ownerName}</p>
          <p className="truncate text-sm text-slate-500">{shopName}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-700">
            <BadgeCheckIcon className="h-4 w-4 text-brand-600" />
            Verified partner
          </p>
        </div>
      </Card>

      <section>
        <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-slate-500">Business details</h2>
        <Card className="divide-y divide-slate-100">
          <DetailRow icon={StoreIcon} label="Shop" value={shopName} />
          <DetailRow icon={UserIcon} label="Owner" value={ownerName} />
          <DetailRow icon={PhoneIcon} label="Mobile" value={vendorPhone} />
          <DetailRow icon={MailIcon} label="Email" value={email || "Not added"} />
          <DetailRow icon={MapPinIcon} label="Region" value={`${districtName}, UP`} />
        </Card>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-slate-500">Support</h2>
        <Card className="divide-y divide-slate-100 overflow-hidden">
          <ActionRow icon={PhoneIcon} label="Call district team" detail={<span className="hidden sm:inline">{SUPPORT_PHONE_DISPLAY}</span>} href={`tel:${SUPPORT_PHONE}`} />
          <ActionRow icon={ChatIcon} label="Chat on WhatsApp" href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer" />
        </Card>
      </section>

      <button
        type="button"
        onClick={onLogout}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 cursor-pointer"
      >
        <LogOutIcon className="h-[18px] w-[18px]" />
        Log out
      </button>
    </div>
  );
}
