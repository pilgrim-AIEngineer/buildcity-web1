// yaha check karte hai ki app vendor mode me chal raha hai ya normal customer store me
// play store partner app me webview ke sath marker check hota hai
export const PARTNER_UA_MARKER = "BuildCityPartner";

const inPartnerShell =
  typeof navigator !== "undefined" && typeof navigator.userAgent === "string" && navigator.userAgent.includes(PARTNER_UA_MARKER);

export const isVendorApp = import.meta.env.VITE_APP_MODE === "vendor" || inPartnerShell;
