import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/** Direktorijum gde je ovaj `next.config` (`frontend/`) — ispravlja Turbopack kad postoji i root `package-lock.json`. */
const frontendDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /**
   * Bez ovoga Next uzima pogrešan „workspace root“ (roditeljski package-lock) i u dev-u
   * može da pukne serviranje `/_next/static/css/*.css` (500) pri pristupu preko LAN IP.
   */
  turbopack: {
    root: frontendDir,
  },

  /**
   * U `next dev` Next.js blokira cross-origin pristup `/_next/*` (chunkovi, CSS).
   * Kada otvoriš app kao http://192.168.x.x:3000, Origin je LAN host — bez ovoga
   * telefon/drugi PC dobija 403 na statiku i stranica izgleda kao goli HTML.
   * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
   */
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],

  async redirects() {
    return [
      { source: "/finansije", destination: "/finances", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
