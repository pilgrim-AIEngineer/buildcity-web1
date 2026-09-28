// Over-the-air update check for the vendor Android app (@capgo/capacitor-updater, self-hosted).
// The vendor app POSTs its state on launch/resume; we answer with the bundle built by the current deploy
// (dist/ota/vendor/latest.json, see scripts/ota-bundle.mjs) or "up_to_date".
const LATEST_URL = "https://www.buildcity.in/ota/vendor/latest.json";

// "1.10" > "1.9"; missing parts count as 0
const compareVersions = (a = "0", b = "0") => {
  const pa = String(a).split(".").map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

const upToDate = (res, message, version) =>
  res.status(200).json({ kind: "up_to_date", message, ...(version ? { version } : {}) });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed", message: "Use POST" });
  }

  let body = req.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch {
      body = {};
    }
  }
  const currentBundle = body.version_name || "builtin";
  const nativeVersion = body.version_build || "0";

  let latest;
  try {
    const r = await fetch(LATEST_URL, { cache: "no-store" });
    if (!r.ok) throw new Error(`latest.json HTTP ${r.status}`);
    latest = await r.json();
  } catch (err) {
    return upToDate(res, `No update available (${err.message})`);
  }

  if (!latest?.version || !latest?.url) return upToDate(res, "No update available");
  if (currentBundle === latest.version) return upToDate(res, "Already on the latest bundle", latest.version);
  if (compareVersions(nativeVersion, latest.minNativeVersion) < 0) {
    return upToDate(res, `Needs app ${latest.minNativeVersion}+ from the Play Store`, currentBundle);
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ version: latest.version, url: latest.url, checksum: latest.checksum });
}
