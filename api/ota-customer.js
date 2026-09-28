// OTA update check for customer app has been permanently disabled.
// All customer apps now run natively and never auto-downgrade from server bundles.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ kind: "up_to_date", message: "OTA updates disabled for Customer app" });
}
