import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aya Mobile",
    short_name: "Aya Mobile",
    description: "Aya Mobile ERP/POS",
    id: "/",
    lang: "ar",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    background_color: "#0f172a",
    theme_color: "#0f172a",
    categories: ["business", "productivity", "finance"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/aya-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/aya-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
