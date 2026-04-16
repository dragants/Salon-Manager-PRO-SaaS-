import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Salon Manager PRO",
    short_name: "Salon PRO",
    description:
      "Za salone lepote i wellness: kalendar, klijenti, finansije, online rezervacije i podsetnici.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f4f6f2",
    theme_color: "#38766a",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/pwa-icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/pwa-icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
