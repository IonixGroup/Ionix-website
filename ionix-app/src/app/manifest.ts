import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ionix Group — Gestione cantieri",
    short_name: "Ionix Group",
    description: "Gestione cantieri, squadra, presenze e pagamenti — Ionix Group.",
    start_url: "/login",
    display: "standalone",
    background_color: "#2B1610",
    theme_color: "#2B1610",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
