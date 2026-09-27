// Which app is this page running as?
//
// - Vendor builds (`npm run build:vendor`, VITE_APP_MODE=vendor) are always the partner app.
// - The Play Store partner app loads the live site (https://www.buildcity.in) and marks its
//   WebView user agent with PARTNER_UA_MARKER (see scripts/android.mjs), so the same deployment
//   renders the vendor app there and the storefront everywhere else.
export const PARTNER_UA_MARKER = "BuildCityPartner";

const inPartnerShell =
  typeof navigator !== "undefined" && typeof navigator.userAgent === "string" && navigator.userAgent.includes(PARTNER_UA_MARKER);

export const isVendorApp = import.meta.env.VITE_APP_MODE === "vendor" || inPartnerShell;
