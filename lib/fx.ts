import "server-only";

const FALLBACK_USD_RATE = 1.17;

/** EUR → USD, refreshed once a day. Only used to display dollar estimates. */
export async function getUsdRate() {
  try {
    const res = await fetch("https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD", {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return FALLBACK_USD_RATE;
    const data = (await res.json()) as { rates?: { USD?: number } };
    return data.rates?.USD ?? FALLBACK_USD_RATE;
  } catch {
    return FALLBACK_USD_RATE;
  }
}
