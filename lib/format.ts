import { locale } from "./i18n";
import { site } from "./config";
import type { Lang, Spot } from "./spots";

export type Currency = "EUR" | "USD";

export function formatMoney(eur: number, lang: Lang, currency: Currency = "EUR", usdRate = 1) {
  const value = currency === "USD" ? eur * usdRate : eur;
  return new Intl.NumberFormat(locale(lang), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    useGrouping: "always",
  }).format(Math.round(value));
}

export function formatSize(spot: Spot, lang: Lang) {
  const n = new Intl.NumberFormat(locale(lang));
  return `${n.format(spot.w)} × ${n.format(spot.h)} cm`;
}

export function formatDay(iso: string, lang: Lang) {
  return new Intl.DateTimeFormat(locale(lang), {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: site.timeZone,
  }).format(new Date(iso));
}

export function formatTime(iso: string, lang: Lang) {
  return new Intl.DateTimeFormat(locale(lang), {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: site.timeZone,
  }).format(new Date(iso));
}

export function dayKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: site.timeZone }).format(new Date(iso));
}

/** "3d 4h", "5h 12m", "42m" — compact and language-neutral. */
export function formatSpan(ms: number) {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function relativeTime(iso: string, lang: Lang, now = Date.now()) {
  const seconds = Math.round((Date.parse(iso) - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale(lang), { numeric: "auto" });
  const abs = Math.abs(seconds);
  if (abs < 60) return rtf.format(seconds, "second");
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  return rtf.format(Math.round(seconds / 86400), "day");
}

export function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
