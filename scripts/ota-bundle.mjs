#!/usr/bin/env node
// Package the freshly built web app (dist/) as an over-the-air update for the customer Android app.
// Runs after `vite build` on every Vercel deploy; the result is served as static files:
//   dist/ota/customer/<version>.zip   the bundle the app downloads
//   dist/ota/customer/latest.json     { version, url, checksum, minNativeVersion }
// api/ota-customer.js reads latest.json and tells the app whether to update.
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { zipSync } from "fflate";

const DIST = "dist";
const OUT_DIR = join(DIST, "ota", "customer");
const PUBLIC_BASE = "https://www.buildcity.in/ota/customer";

// Oldest customer app (android versionName) that can run this web bundle. Raise it when a release
// adds or upgrades a native Capacitor plugin, so older installs wait for the Play Store update.
const MIN_NATIVE_VERSION = "1.1";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const sha = (() => {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA;
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return String(Date.now());
  }
})();
const version = `${pkg.version}-${sha.slice(0, 7)}`;

// Zip everything in dist/ except previous OTA output, with index.html at the zip root
const files = {};
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const rel = relative(DIST, path).split("\\").join("/");
    if (rel === "ota" || rel.startsWith("ota/")) continue;
    if (statSync(path).isDirectory()) walk(path);
    else files[rel] = readFileSync(path);
  }
};
walk(DIST);
if (!files["index.html"]) {
  console.error("ota-bundle: dist/index.html not found — run vite build first");
  process.exit(1);
}

const zip = zipSync(files, { level: 9 });
const checksum = createHash("sha256").update(zip).digest("hex");

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, `${version}.zip`), zip);
writeFileSync(
  join(OUT_DIR, "latest.json"),
  JSON.stringify({ version, url: `${PUBLIC_BASE}/${version}.zip`, checksum, minNativeVersion: MIN_NATIVE_VERSION }, null, 2) + "\n"
);

console.log(`ota-bundle: customer ${version} (${(zip.length / 1024 / 1024).toFixed(2)} MB, ${Object.keys(files).length} files)`);
