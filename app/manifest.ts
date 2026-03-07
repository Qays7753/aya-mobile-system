import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aya Mobile",
    short_name: "Aya Mobile",
    description: "Aya Mobile ERP/POS",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/aya-icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/aya-icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
