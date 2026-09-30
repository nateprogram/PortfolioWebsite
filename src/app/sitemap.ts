import type { MetadataRoute } from "next";
import { DATA } from "@/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = DATA.url;
  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/resume`, changeFrequency: "monthly", priority: 0.9 },
    ...DATA.projects.map((p) => ({
      url: `${base}${p.href}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
