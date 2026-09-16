import "server-only";
import { isClosed, site } from "./config";
import { emailAdminNewBid, emailBadgeLate, emailClosed, emailLate, emailLeading, emailOutbid, emailRejected } from "./email";
import { getPayments } from "./payments";
import { announce } from "./realtime";
import { getStore } from "./store";
import type { BidRow } from "./types";

// Shared by the Stripe webhook and the fake dev checkout.

function services() {
  const store = getStore();
  const payments = getPayments();
  if (!store || !payments) throw new Error("Store or payments not configured");
  return { store, payments };
}

/** Refunds every paid bid on a spot that no longer holds it. Safe to run repeatedly. */
async function settleRefunds(spotId: string) {
  const { store, payments } = services();
  const bids = await store.listBidsForSpot(spotId);
  const owed = bids.filter(
    (b) => (b.status === "outbid" || b.status === "rejected") && b.stripe_payment_intent && !b.refunded_at,
  );
  for (const bid of owed) {
    try {
      // Bids bought together share one payment: give back only this bid's share.
      const refundId = await payments.refund(
        bid.stripe_payment_intent!,
        `refund-bid-${bid.id}`,
        bid.bundle_id ? bid.deposit * 100 : undefined,
      );
      await store.updateBid(bid.id, { refund_id: refundId, refunded_at: new Date().toISOString() });
    } catch (error) {
      console.error(`[refund] bid ${bid.id} failed`, error);
    }
  }
}

/** `paymentIntent` is null when a 100% coupon made the checkout free: nothing to refund later. */
export async function fulfillBid(bidId: string, sessionId: string, paymentIntent: string | null) {
  const { store } = services();

  // A checkout stays open for 30 minutes, so a payment can land after bidding closed: it doesn't count.
  if (isClosed()) {
    const bid = await store.getBid(bidId);
    if (!bid || bid.status !== "pending") return bid ? "noop" : "missing";
    const now = new Date().toISOString();
    await store.updateBid(bidId, {
      status: "outbid",
      stripe_payment_intent: paymentIntent,
      stripe_session_id: bid.stripe_session_id ?? sessionId,
      confirmed_at: now,
      outbid_at: now,
    });
    await settleRefunds(bid.spot_id);
    await emailClosed(bid);
    return "closed";
  }

  const result = await store.confirmBid(bidId, paymentIntent ?? "coupon", site.auction.minIncrement);
  if (result.outcome === "missing" || result.outcome === "noop") return result.outcome;
  if (!paymentIntent) await store.updateBid(bidId, { stripe_payment_intent: null });

  const bid = (await store.getBid(bidId)) as BidRow;
  if (!bid.stripe_session_id) await store.updateBid(bidId, { stripe_session_id: sessionId });
  await settleRefunds(bid.spot_id);

  if (result.outcome === "late") {
    await emailLate(bid);
    return "late";
  }

  const displaced = result.displaced ? await store.getBid(result.displaced) : null;
  await Promise.all([
    emailLeading(bid),
    emailAdminNewBid(bid),
    displaced ? emailOutbid(displaced, bid.amount) : null,
  ]);
  await announce({ type: "bid", spotId: bid.spot_id, amount: bid.amount });
  return "leading";
}

/**
 * Confirms every bid bought in one checkout. Each spot is confirmed on its own, so a spot someone else
 * took while this checkout was open is marked late and only its share is refunded.
 * `amountTotal`/`amountSubtotal` are in cents and spread a promotion code's discount across the bids.
 */
export async function fulfillBundle(
  bundleId: string,
  sessionId: string,
  paymentIntent: string | null,
  amountTotal: number | null,
  amountSubtotal: number | null,
) {
  const { store } = services();
  const bids = (await store.listBidsByBundle(bundleId)).filter((b) => b.status === "pending");
  if (bids.length === 0) return "noop";

  const ratio = amountSubtotal && amountTotal !== null ? amountTotal / amountSubtotal : 1;
  const closed = isClosed();
  const now = new Date().toISOString();
  const results: string[] = [];
  const touched = new Set<string>();

  for (const bid of bids) {
    // What this bid actually cost after any discount, rounded down so refunds never exceed the payment.
    const charged = Math.floor(bid.amount * ratio);
    await store.updateBid(bid.id, { deposit: Math.max(0, charged), stripe_session_id: bid.stripe_session_id ?? sessionId });
    if (closed) {
      await store.updateBid(bid.id, { status: "outbid", stripe_payment_intent: paymentIntent, confirmed_at: now, outbid_at: now });
      results.push("closed");
    } else {
      const result = await store.confirmBid(bid.id, paymentIntent ?? "coupon", site.auction.minIncrement);
      if (!paymentIntent) await store.updateBid(bid.id, { stripe_payment_intent: null });
      results.push(result.outcome);
      if (result.outcome === "leading" && result.displaced) {
        const displaced = await store.getBid(result.displaced);
        if (displaced) await emailOutbid(displaced, bid.amount);
      }
    }
    touched.add(bid.spot_id);
  }

  for (const spotId of touched) await settleRefunds(spotId);
  const first = bids[0];
  await emailAdminNewBid(first);
  const leading = results.filter((r) => r === "leading").length;
  if (leading > 0) await announce({ type: "bid", spotId: first.spot_id, amount: bids.reduce((s, b) => s + b.amount, 0) });
  return leading === bids.length ? "leading" : leading > 0 ? "partial" : closed ? "closed" : "late";
}

export async function fulfillBadge(claimId: string, sessionId: string, paymentIntent: string | null) {
  const { store, payments } = services();
  const result = await store.confirmBadgeClaim(claimId, paymentIntent ?? "coupon", site.badge.start, site.badge.step);
  if (result.outcome === "missing" || result.outcome === "noop") return result.outcome;
  if (!paymentIntent) await store.updateBadgeClaim(claimId, { stripe_payment_intent: null });

  const claim = await store.getBadgeClaim(claimId);
  if (!claim) return "missing";
  if (!claim.stripe_session_id) await store.updateBadgeClaim(claimId, { stripe_session_id: sessionId });

  if (result.outcome === "late" && paymentIntent) {
    try {
      const refundId = await payments.refund(paymentIntent, `refund-badge-${claimId}`);
      await store.updateBadgeClaim(claimId, { refund_id: refundId, refunded_at: new Date().toISOString() });
    } catch (error) {
      console.error(`[refund] badge ${claimId} failed`, error);
    }
    await emailBadgeLate(claim);
    return "late";
  }
  if (result.outcome === "late") return "late";

  await announce({ type: "badge", amount: claim.amount });
  return "held";
}

export async function expireCheckout(kind: string, refId: string) {
  const { store } = services();
  if (kind === "bundle") {
    for (const bid of await store.listBidsByBundle(refId)) {
      if (bid.status === "pending") await store.updateBid(bid.id, { status: "expired" });
    }
  } else if (kind === "bid") {
    const bid = await store.getBid(refId);
    if (bid?.status === "pending") await store.updateBid(refId, { status: "expired" });
  } else if (kind === "badge") {
    const claim = await store.getBadgeClaim(refId);
    if (claim?.status === "pending") await store.updateBadgeClaim(refId, { status: "expired" });
  }
}

// ---- Admin -----------------------------------------------------------------

export async function approveBid(bidId: string) {
  const { store } = services();
  const now = new Date().toISOString();
  const bid = await store.getBid(bidId);
  // Spots bought together carry the same logo: approving one approves them all.
  const siblings = bid?.bundle_id ? await store.listBidsByBundle(bid.bundle_id) : [];
  for (const sibling of siblings) if (!sibling.approved_at && sibling.id !== bidId) await store.updateBid(sibling.id, { approved_at: now });
  await store.updateBid(bidId, { approved_at: now });
  await announce({ type: "review" });
}

export async function rejectBid(bidId: string) {
  const { store } = services();
  const bid = await store.getBid(bidId);
  if (!bid || bid.status === "pending" || bid.status === "expired" || bid.status === "rejected") return;
  await store.updateBid(bidId, {
    status: "rejected",
    approved_at: null,
    rejected_at: new Date().toISOString(),
  });
  await settleRefunds(bid.spot_id);
  await emailRejected(bid);
  await announce({ type: "review" });
}

export async function retryRefunds(spotId: string) {
  await settleRefunds(spotId);
}

// ---- Sponsors managed by hand ------------------------------------------------

/** Marks a bid entered from the admin (paid outside Stripe). */
export const MANUAL = "manual";

export type ManualSponsor = {
  spotId: string;
  brand: string;
  amount: number;
  url: string | null;
  email: string;
  logo: File;
  logoExt: string;
};

/** Makes a sponsor paid outside Stripe the holder of a spot, replacing whoever held it. */
export async function setSponsor(input: ManualSponsor) {
  const store = getStore();
  if (!store) throw new Error("Store not configured");
  const now = new Date().toISOString();

  const current = (await store.listBidsForSpot(input.spotId)).find((b) => b.status === "active");
  if (current) {
    const manual = current.stripe_session_id === MANUAL;
    // A hand-entered holder is simply replaced; a real bidder is outbid and refunded.
    await store.updateBid(current.id, manual ? { status: "rejected", rejected_at: now } : { status: "outbid", outbid_at: now });
  }

  const logoPath = await store.uploadLogo(input.logo, `${crypto.randomUUID()}.${input.logoExt}`);
  const bid = await store.createBid({
    spot_id: input.spotId,
    amount: input.amount,
    deposit: input.amount,
    brand: input.brand,
    url: input.url,
    x_handle: null,
    email: input.email,
    logo_path: logoPath,
    logo_includes_name: true,
    lang: "it",
    bidder_id: crypto.randomUUID(),
  });
  await store.confirmBid(bid.id, MANUAL, 0);
  await store.updateBid(bid.id, {
    stripe_session_id: MANUAL,
    stripe_payment_intent: null,
    approved_at: now,
    balance_paid_at: now,
  });

  if (current && current.stripe_session_id !== MANUAL && getPayments()) await settleRefunds(input.spotId);
  await announce({ type: "bid", spotId: input.spotId, amount: input.amount });
}

/** Frees a spot: hand-entered sponsors are just removed, real bids are refused and refunded. */
export async function removeSponsor(bidId: string) {
  const store = getStore();
  if (!store) throw new Error("Store not configured");
  const bid = await store.getBid(bidId);
  if (!bid || bid.status !== "active") return;
  if (bid.stripe_session_id === MANUAL) {
    await store.updateBid(bidId, { status: "rejected", rejected_at: new Date().toISOString() });
    await announce({ type: "review" });
  } else {
    await rejectBid(bidId);
  }
}
