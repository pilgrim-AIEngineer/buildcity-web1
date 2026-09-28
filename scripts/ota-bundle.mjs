#!/usr/bin/env node
// Package the freshly built web app (dist/) as an over-the-air update for the vendor Android app.
// Runs after `vite build` on every Vercel deploy; the result is served as static files:
//   dist/ota/vendor/<version>.zip   the bundle the vendor app downloads
//   dist/ota/vendor/latest.json     { version, url, checksum, minNativeVersion }
// api/ota-vendor.js reads latest.json and tells the vendor app whether to update.
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { zipSync } from "fflate";

const DIST = "dist";
const OUT_DIR = join(DIST, "ota", "vendor");
const PUBLIC_BASE = "https://www.buildcity.in/ota/vendor";

// Oldest vendor app (android versionName) that can run this web bundle.
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

console.log(`ota-bundle: vendor ${version} (${(zip.length / 1024 / 1024).toFixed(2)} MB, ${Object.keys(files).length} files)`);
