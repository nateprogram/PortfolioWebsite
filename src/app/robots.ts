import type { MetadataRoute } from "next";
import { DATA } from "@/data";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/tools/", "/api/"] },
    sitemap: `${DATA.url}/sitemap.xml`,
  };
}
