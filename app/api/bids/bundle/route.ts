import { ensureBidderId } from "@/lib/bidder";
import { isClosed } from "@/lib/config";
import { biddingEnabled } from "@/lib/env";
import { formatMoney } from "@/lib/format";
import { dict, localePath, parseLang } from "@/lib/i18n";
import { getPayments } from "@/lib/payments";
import { isSpotOpen, spotById, spots } from "@/lib/spots";
import { buildPublicState } from "@/lib/state";
import { getStore } from "@/lib/store";
import { cleanText, isEmail, LOGO_TYPES, MAX_LOGO_BYTES, normalizeHandle, normalizeUrl } from "@/lib/validation";

const fail = (error: string, status = 400) => Response.json({ error }, { status });

/** Takes every spot the lead buyer holds, at each spot's minimum outbid, in one checkout. */
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
  if (cleanText(form.get("company"), 10)) return fail(t.generic);

  const brand = cleanText(form.get("brand"), 60);
  const email = cleanText(form.get("email"), 200).toLowerCase();
  const url = normalizeUrl(cleanText(form.get("url"), 300));
  const xHandle = normalizeHandle(cleanText(form.get("xHandle"), 40));
  const logo = form.get("logo");
  const wanted = cleanText(form.get("spotIds"), 100).split(",").filter(Boolean).sort();
  // Buying the whole tee at the goal price isn't live yet; only the lead buyer takeover is.
  const BUY_ALL_LIVE = false;
  const scope = cleanText(form.get("scope"), 5) === "all" ? "all" : "top";
  if (scope === "all" && !BUY_ALL_LIVE) return fail(t.notOpen, 503);

  if (!brand) return fail(t.brand);
  if (!isEmail(email)) return fail(t.email);
  if (url === "invalid") return fail(t.url);
  if (xHandle === "invalid") return fail(t.xHandle);
  if (!(logo instanceof File) || logo.size === 0) return fail(t.logo);
  if (!LOGO_TYPES[logo.type]) return fail(t.logoType);
  if (logo.size > MAX_LOGO_BYTES) return fail(t.logoSize);
  if (form.get("terms") !== "on") return fail(t.terms);

  // Prices come from the database, never from the form.
  const allBids = (await Promise.all(spots.map((s) => store.listBidsForSpot(s.id)))).flat();
  const state = buildPublicState(allBids, [], { enabled: true, logoUrl: (p) => store.logoUrl(p), goal: await store.getGoal() });

  let items: { spotId: string; price: number }[];
  let title: string;
  if (scope === "all") {
    items = spots.filter((s) => isSpotOpen(s)).map((s) => ({ spotId: s.id, price: state.spots[s.id].nextMin }));
    title = lang === "it" ? "Tutta la maglietta" : "The whole tee";
  } else {
    const top = state.topBuyer;
    const current = top ? top.spots.map((s) => s.spotId).sort() : [];
    if (!top || current.join(",") !== wanted.join(",")) return fail(t.bundleChanged, 409);
    if (top.brand.trim().toLowerCase() === brand.toLowerCase()) return fail(t.bundleSelf, 409);
    items = top.spots.map((s) => ({ spotId: s.spotId, price: s.nextMin }));
    title = lang === "it" ? `Tutti gli spazi di ${top.brand}` : `All of ${top.brand}'s spots`;
  }
  if (items.length === 0) return fail(t.generic, 409);

  const bidderId = await ensureBidderId();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  if ((await store.countBidsSince(bidderId, hourAgo)) >= 12) return fail(t.tooMany, 429);

  try {
    const logoPath = await store.uploadLogo(logo, `${crypto.randomUUID()}.${LOGO_TYPES[logo.type]}`);
    const bundleId = crypto.randomUUID();
    const lines: { title: string; amount: number }[] = [];
    let sessionBids: string[] = [];
    for (const item of items) {
      const spot = spotById.get(item.spotId)!;
      const bid = await store.createBid({
        spot_id: spot.id,
        amount: item.price,
        deposit: item.price,
        brand,
        url,
        x_handle: xHandle,
        email,
        logo_path: logoPath,
        logo_includes_name: form.get("logoIncludesName") === "on",
        lang,
        bidder_id: bidderId,
        bundle_id: bundleId,
      });
      sessionBids = [...sessionBids, bid.id];
      lines.push({ title: `${spot.id} ${spot.name[lang]}`, amount: item.price });
    }

    const total = lines.reduce((sum, l) => sum + l.amount, 0);
    const origin = new URL(request.url).origin;
    const back = `${origin}${localePath(lang, "/")}`;
    const checkout = await payments.createCheckout({
      kind: "bundle",
      refId: bundleId,
      amount: total,
      title,
      lines,
      description: dict(lang).home.bundleNote,
      email,
      lang,
      successUrl: `${back}?paid=bundle&ref=${bundleId}`,
      cancelUrl: `${back}?cancelled=bundle&ref=${bundleId}`,
    });
    for (const id of sessionBids) await store.updateBid(id, { stripe_session_id: checkout.id });

    console.info(`[bundle] ${bundleId} scope=${scope} ${lines.length} spots ${formatMoney(total, "en")}`);
    return Response.json({ id: bundleId, checkoutUrl: checkout.url });
  } catch (error) {
    console.error("[bundle] could not create", error);
    return fail(t.generic, 500);
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 30;
