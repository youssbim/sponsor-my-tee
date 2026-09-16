import type { MetadataRoute } from "next";
import { site } from "@/lib/config";

const paths = ["/", "/leaderboard", "/terms", "/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({
    url: `${site.url}${path === "/" ? "" : path}`,
    alternates: {
      languages: {
        en: `${site.url}${path === "/" ? "" : path}`,
        it: `${site.url}/it${path === "/" ? "" : path}`,
      },
    },
  }));
}
