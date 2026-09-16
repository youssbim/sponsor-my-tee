"use client";

import { SiteHeader } from "../site-header";

export function HomeHeader() {
  return <SiteHeader onCta={() => document.getElementById("spots")?.scrollIntoView({ behavior: "smooth" })} />;
}
