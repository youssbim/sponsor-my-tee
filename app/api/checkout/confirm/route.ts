import { fulfillBadge, fulfillBid, fulfillBundle } from "@/lib/fulfill";
import { getPayments } from "@/lib/payments";
import { getStore } from "@/lib/store";

/**
 * Called when someone comes back from checkout. Asks Stripe directly whether the session was paid and
 * confirms it, so a slow or missing webhook never leaves a paid bid stuck. Safe to call repeatedly:
 * it only acts on pending rows and the confirmation itself is idempotent.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { kind?: string; ref?: string };
  const store = getStore();
  const payments = getPayments();
  if (!store || !payments || typeof body.ref !== "string") return Response.json({ ok: false }, { status: 400 });

  const row =
    body.kind === "badge"
      ? await store.getBadgeClaim(body.ref)
      : body.kind === "bid"
        ? await store.getBid(body.ref)
        : body.kind === "bundle"
          ? ((await store.listBidsByBundle(body.ref)).find((b) => b.status === "pending") ?? null)
          : null;
  if (!row || row.status !== "pending" || !row.stripe_session_id) return Response.json({ ok: true, changed: false });

  try {
    const result = await payments.checkoutResult(row.stripe_session_id);
    if (!result?.paid || (!result.paymentIntent && !result.free)) {
      return Response.json({ ok: true, changed: false, status: result?.status ?? null, paymentStatus: result?.paymentStatus ?? null });
    }
    const outcome =
      body.kind === "bundle"
        ? await fulfillBundle(body.ref, row.stripe_session_id, result.paymentIntent, result.amountTotal, result.amountSubtotal)
        : body.kind === "badge"
          ? await fulfillBadge(row.id, row.stripe_session_id, result.paymentIntent)
          : await fulfillBid(row.id, row.stripe_session_id, result.paymentIntent);
    return Response.json({ ok: true, changed: true, outcome });
  } catch (error) {
    console.error("[checkout/confirm] failed", error);
    return Response.json({ ok: false }, { status: 502 });
  }
}
