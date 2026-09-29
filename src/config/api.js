import { Capacitor } from "@capacitor/core";

// backend railway url aur verified custom domain yaha define hai
export const RAILWAY_API_URL = "https://buildcity-web-production-a5ca.up.railway.app";
export const PRODUCTION_WEB_URL = "https://www.buildcity.in";

// browser me relative path chalega taaki vercel reverse proxy se cors ka issue na aaye
// aur agar mobile app (apk) hai toh direct domain url use karenge
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (Capacitor.isNativePlatform()
    ? PRODUCTION_WEB_URL
    : "");

