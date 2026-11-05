import type { MetadataRoute } from "next";

const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: { path: string; priority: number }[] = [
    { path: "/", priority: 1 },
    { path: "/pricing", priority: 0.8 },
    { path: "/dashboard", priority: 0.7 },
    { path: "/tools/reply", priority: 0.8 },
    { path: "/tools/negotiate", priority: 0.8 },
    { path: "/tools/risk-check", priority: 0.8 },
    { path: "/tools/pitch", priority: 0.8 },
    { path: "/tools/rate-calculator", priority: 0.9 },
    { path: "/signup", priority: 0.5 },
    { path: "/privacy", priority: 0.3 },
  ];
  return routes.map((r) => ({ url: `${base}${r.path}`, changeFrequency: "weekly", priority: r.priority }));
}
