import type { MetadataRoute } from "next";

function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    return raw.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

export default function robots(): MetadataRoute.Robots {
  const base = siteOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/calendar",
        "/clients",
        "/services",
        "/settings",
        "/finances",
        "/analytics",
        "/account",
        "/subscribe",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
