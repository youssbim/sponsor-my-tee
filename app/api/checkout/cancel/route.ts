import { readBidderId } from "@/lib/bidder";
import { getPayments } from "@/lib/payments";
import { getStore } from "@/lib/store";

/** Called when someone comes back from a cancelled checkout. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { kind?: string; ref?: string };
  const bidderId = await readBidderId();
  const store = getStore();
  const payments = getPayments();
  if (!bidderId || !store || !payments || typeof body.ref !== "string") {
    return Response.json({ ok: false }, { status: 400 });
  }

  if (body.kind === "bundle") {
    const bids = await store.listBidsByBundle(body.ref);
    const pending = bids.filter((b) => b.status === "pending" && b.bidder_id === bidderId);
    if (pending[0]?.stripe_session_id) await payments.expireCheckout(pending[0].stripe_session_id);
    for (const bid of pending) await store.updateBid(bid.id, { status: "expired" });
    return Response.json({ ok: pending.length > 0 });
  }

  const row =
    body.kind === "badge" ? await store.getBadgeClaim(body.ref) : body.kind === "bid" ? await store.getBid(body.ref) : null;
  if (!row || row.bidder_id !== bidderId || row.status !== "pending") return Response.json({ ok: false });

  if (row.stripe_session_id) await payments.expireCheckout(row.stripe_session_id);
  if (body.kind === "badge") await store.updateBadgeClaim(row.id, { status: "expired" });
  else await store.updateBid(row.id, { status: "expired" });

  return Response.json({ ok: true });
}
