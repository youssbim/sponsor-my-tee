import { ensureBidderId } from "@/lib/bidder";
import { isClosed, nextMinimum } from "@/lib/config";
import { biddingEnabled } from "@/lib/env";
import { formatMoney } from "@/lib/format";
import { dict, localePath, parseLang } from "@/lib/i18n";
import { getPayments } from "@/lib/payments";
import { isSpotOpen, spotById } from "@/lib/spots";
import { getStore } from "@/lib/store";
import {
  cleanText,
  isEmail,
  LOGO_TYPES,
  MAX_LOGO_BYTES,
  normalizeHandle,
  normalizeUrl,
  parseAmount,
} from "@/lib/validation";

const fail = (error: string, status = 400, extra: Record<string, unknown> = {}) =>
  Response.json({ error, ...extra }, { status });

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(dict("en").errors.generic);
  }

  const lang = parseLang(form.get("lang"));
  const t = dict(lang).errors;
  const store = getStore();
  const payments = getPayments();
  if (!biddingEnabled || !store || !payments) return fail(t.notOpen, 503);
  if (isClosed()) return fail(t.closed, 409);

  // Bots fill every field, people never see this one.
  if (cleanText(form.get("company"), 10)) return fail(t.generic);

  const spot = spotById.get(cleanText(form.get("spotId"), 8));
  if (!spot) return fail(t.spot);
  if (!isSpotOpen(spot)) return fail(t.spotLocked, 409);

  const brand = cleanText(form.get("brand"), 60);
  const email = cleanText(form.get("email"), 200).toLowerCase();
  const url = normalizeUrl(cleanText(form.get("url"), 300));
  const xHandle = normalizeHandle(cleanText(form.get("xHandle"), 40));
  const amount = parseAmount(form.get("amount"));
  const logo = form.get("logo");

  if (!brand) return fail(t.brand);
  if (!isEmail(email)) return fail(t.email);
  if (url === "invalid") return fail(t.url);
  if (xHandle === "invalid") return fail(t.xHandle);
  if (!(logo instanceof File) || logo.size === 0) return fail(t.logo);
  if (!LOGO_TYPES[logo.type]) return fail(t.logoType);
  if (logo.size > MAX_LOGO_BYTES) return fail(t.logoSize);
  if (form.get("terms") !== "on") return fail(t.terms);

  const current = (await store.listBidsForSpot(spot.id)).find((b) => b.status === "active");
  const minimum = current ? nextMinimum(current.amount) : spot.min;
  if (!Number.isFinite(amount) || amount < minimum || amount > 100_000) {
    return fail(t.amount(formatMoney(minimum, lang)), 409, { minimum });
  }

  const bidderId = await ensureBidderId();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  if ((await store.countBidsSince(bidderId, hourAgo)) >= 12) return fail(t.tooMany, 429);

  try {
    const logoPath = await store.uploadLogo(logo, `${crypto.randomUUID()}.${LOGO_TYPES[logo.type]}`);
    // The whole bid is paid up front; the deposit column records what was charged.
    const bid = await store.createBid({
      spot_id: spot.id,
      amount,
      deposit: amount,
      brand,
      url,
      x_handle: xHandle,
      email,
      logo_path: logoPath,
      logo_includes_name: form.get("logoIncludesName") === "on",
      lang,
      bidder_id: bidderId,
    });

    const origin = new URL(request.url).origin;
    const back = `${origin}${localePath(lang, "/")}`;
    const checkout = await payments.createCheckout({
      kind: "bid",
      refId: bid.id,
      amount,
      title: lang === "it" ? `Offerta · ${spot.id} ${spot.name.it}` : `Bid · ${spot.id} ${spot.name.en}`,
      description: dict(lang).dialog.payNote,
      email,
      lang,
      successUrl: `${back}?paid=bid&ref=${bid.id}`,
      cancelUrl: `${back}?cancelled=bid&ref=${bid.id}`,
    });
    await store.updateBid(bid.id, { stripe_session_id: checkout.id });

    return Response.json({ id: bid.id, checkoutUrl: checkout.url });
  } catch (error) {
    console.error("[bids] could not create bid", error);
    return fail(t.generic, 500);
  }
}
