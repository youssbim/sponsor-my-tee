const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HANDLE = /^@?([A-Za-z0-9_]{1,15})$/;

export const LOGO_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

// Vercel functions accept request bodies up to 4.5 MB.
export const MAX_LOGO_BYTES = 4 * 1024 * 1024;

export function cleanText(value: FormDataEntryValue | unknown, max: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";
}

export function isEmail(value: string) {
  return value.length <= 200 && EMAIL.test(value);
}

/** Accepts "acme.com", "https://acme.com/x". Returns a normalised https URL or null. */
export function normalizeUrl(value: string): string | null | "invalid" {
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname.includes(".") || url.hostname.length > 253) return "invalid";
    url.protocol = "https:";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "invalid";
  }
}

/** Accepts "@acme", "acme", "x.com/acme". Returns the bare handle or null. */
export function normalizeHandle(value: string): string | null | "invalid" {
  if (!value) return null;
  const stripped = value.replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, "").replace(/\/$/, "");
  const match = stripped.match(HANDLE);
  return match ? match[1] : "invalid";
}

export function parseAmount(value: FormDataEntryValue | unknown) {
  const n = Number(typeof value === "string" ? value.replace(",", ".") : value);
  return Number.isFinite(n) ? Math.round(n) : NaN;
}
