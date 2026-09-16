import "server-only";
import Stripe from "stripe";
import { hasStripe, useMockPayments } from "./env";
import type { Lang } from "./spots";

export type CheckoutKind = "bid" | "badge" | "bundle";

export type CheckoutInput = {
  kind: CheckoutKind;
  refId: string;
  amount: number; // whole euros
  title: string;
  /** One receipt line per item; defaults to a single line with `title` and `amount`. */
  lines?: { title: string; amount: number }[];
  description?: string;
  email: string;
  lang: Lang;
  successUrl: string;
  cancelUrl: string;
  /** Minutes until the checkout expires (Stripe allows 30 to 1440). */
  expiresInMinutes?: number;
};

export interface Payments {
  kind: "stripe" | "mock";
  createCheckout(input: CheckoutInput): Promise<{ id: string; url: string }>;
  expireCheckout(sessionId: string): Promise<void>;
  /** Refunds the whole payment, or only `amountCents` of it when several bids share one payment. */
  refund(paymentIntent: string, idempotencyKey: string, amountCents?: number): Promise<string>;
  /** Whether a checkout was completed, straight from the provider. Null when the provider can't tell. */
  checkoutResult(
    sessionId: string,
  ): Promise<{
    paid: boolean;
    free: boolean;
    paymentIntent: string | null;
    status: string | null;
    paymentStatus: string;
    amountTotal: number | null;
    amountSubtotal: number | null;
  } | null>;
}

let stripeClient: Stripe | null = null;

export function stripe() {
  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY!);
  return stripeClient;
}

const stripePayments: Payments = {
  kind: "stripe",
  async createCheckout(input) {
    const minutes = Math.min(1440, Math.max(30, input.expiresInMinutes ?? 30));
    const metadata = { kind: input.kind, ref: input.refId };
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: (input.lines ?? [{ title: input.title, amount: input.amount }]).map((line) => ({
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: line.amount * 100,
          product_data: { name: line.title, description: input.description },
        },
      })),
      customer_email: input.email,
      client_reference_id: input.refId,
      metadata,
      payment_intent_data: { metadata, description: input.title },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      expires_at: Math.floor(Date.now() / 1000) + minutes * 60,
      locale: input.lang,
      // Lets buyers redeem promotion codes created in the Stripe dashboard (e.g. a 100% coupon).
      allow_promotion_codes: true,
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return { id: session.id, url: session.url };
  },
  async expireCheckout(sessionId) {
    try {
      await stripe().checkout.sessions.expire(sessionId);
    } catch {
      // Already completed or expired — nothing to do.
    }
  },
  async refund(paymentIntent, idempotencyKey, amountCents) {
    const refund = await stripe().refunds.create(
      { payment_intent: paymentIntent, ...(amountCents ? { amount: amountCents } : {}) },
      { idempotencyKey },
    );
    return refund.id;
  },
  async checkoutResult(sessionId) {
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    // See the webhook: a zero total can come back as "paid" with no payment intent.
    const free = session.payment_status === "no_payment_required" || session.amount_total === 0;
    const paymentIntent = (typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id) ?? null;
    return {
      paid: session.status === "complete" && (session.payment_status === "paid" || free),
      free,
      paymentIntent,
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      amountSubtotal: session.amount_subtotal,
    };
  },
};

const mockPayments: Payments = {
  kind: "mock",
  async createCheckout(input) {
    const id = `mock_cs_${crypto.randomUUID()}`;
    const params = new URLSearchParams({
      session: id,
      kind: input.kind,
      ref: input.refId,
      amount: String(input.amount),
      title: input.title,
      success: input.successUrl,
      cancel: input.cancelUrl,
    });
    return { id, url: `/dev/checkout?${params}` };
  },
  async expireCheckout() {},
  async refund(paymentIntent, _key, amountCents) {
    console.info(`[mock payments] refunded ${paymentIntent}${amountCents ? ` (${amountCents / 100} €)` : ""}`);
    return `mock_re_${crypto.randomUUID()}`;
  },
  async checkoutResult() {
    return null;
  },
};

export function getPayments(): Payments | null {
  if (hasStripe) return stripePayments;
  if (useMockPayments) return mockPayments;
  return null;
}
