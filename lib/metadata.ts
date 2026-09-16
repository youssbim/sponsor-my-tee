import type { Metadata, Viewport } from "next";
import { site } from "./config";
import { dict, localePath } from "./i18n";
import type { Lang } from "./spots";

export function pageMetadata(lang: Lang, path = "/", title?: string): Metadata {
  const t = dict(lang).meta;
  const fullTitle = title ? `${title} · ${site.name}` : t.title;
  return {
    metadataBase: new URL(site.url),
    title: fullTitle,
    description: t.description,
    alternates: {
      canonical: localePath(lang, path),
      languages: { en: localePath("en", path), it: localePath("it", path) },
    },
    openGraph: {
      title: fullTitle,
      description: t.description,
      url: localePath(lang, path),
      siteName: site.name,
      locale: lang === "it" ? "it_IT" : "en_GB",
      type: "website",
    },
    twitter: { card: "summary_large_image", title: fullTitle, description: t.description },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};
