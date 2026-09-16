import { ensureBidderId } from "@/lib/bidder";
import { site } from "@/lib/config";
import { biddingEnabled } from "@/lib/env";
import { formatMoney } from "@/lib/format";
import { dict, localePath, parseLang } from "@/lib/i18n";
import { getPayments } from "@/lib/payments";
import { getStore } from "@/lib/store";
import { cleanText, isEmail, normalizeHandle, normalizeUrl, parseAmount } from "@/lib/validation";

const fail = (error: string, status = 400, extra: Record<string, unknown> = {}) =>
  Response.json({ error, ...extra }, { status });

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const lang = parseLang(body?.lang);
  const t = dict(lang).errors;
  const store = getStore();
  const payments = getPayments();
  if (!body) return fail(t.generic);
  if (!biddingEnabled || !store || !payments) return fail(t.notOpen, 503);
  if (cleanText(body.company, 10)) return fail(t.generic);

  const label = cleanText(body.label, 60);
  const email = cleanText(body.email, 200).toLowerCase();
  const link = cleanText(body.link, 300);
  const amount = parseAmount(body.amount);

  if (!label) return fail(t.label);
  if (!isEmail(email)) return fail(t.email);

  let url: string | null = null;
  let xHandle: string | null = null;
  if (link.startsWith("@") || /^(https?:\/\/)?(www\.)?(x|twitter)\.com\//i.test(link)) {
    const handle = normalizeHandle(link);
    if (handle === "invalid") return fail(t.xHandle);
    xHandle = handle;
  } else if (link) {
    const normalized = normalizeUrl(link);
    if (normalized === "invalid") return fail(t.url);
    url = normalized;
  }

  const held = (await store.listBadgeClaims())
    .filter((c) => c.status === "held" && c.paid_at)
    .sort((a, b) => Date.parse(b.paid_at!) - Date.parse(a.paid_at!))[0];
  const minimum = held ? held.amount + site.badge.step : site.badge.start;
  if (!Number.isFinite(amount) || amount < minimum || amount > 10_000) {
    return fail(t.badgeAmount(formatMoney(minimum, lang)), 409, { minimum });
  }

  try {
    const bidderId = await ensureBidderId();
    const claim = await store.createBadgeClaim({ label, url, x_handle: xHandle, email, amount, lang, bidder_id: bidderId });
    const back = `${new URL(request.url).origin}${localePath(lang, "/")}`;
    const checkout = await payments.createCheckout({
      kind: "badge",
      refId: claim.id,
      amount,
      title: lang === "it" ? "Il badge in cima a One White Tee" : "The badge at the top of One White Tee",
      email,
      lang,
      successUrl: `${back}?paid=badge&ref=${claim.id}`,
      cancelUrl: `${back}?cancelled=badge&ref=${claim.id}`,
    });
    await store.updateBadgeClaim(claim.id, { stripe_session_id: checkout.id });
    return Response.json({ id: claim.id, checkoutUrl: checkout.url });
  } catch (error) {
    console.error("[badge] could not create claim", error);
    return fail(t.generic, 500);
  }
}
