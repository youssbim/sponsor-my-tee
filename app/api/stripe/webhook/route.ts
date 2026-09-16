import type Stripe from "stripe";
import { hasStripe } from "@/lib/env";
import { expireCheckout, fulfillBadge, fulfillBid, fulfillBundle } from "@/lib/fulfill";
import { stripe } from "@/lib/payments";

export async function POST(request: Request) {
  if (!hasStripe) return new Response("Stripe is not configured", { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    console.error("[stripe] bad signature", error);
    return new Response("Bad signature", { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const kind = session.metadata?.kind;
  const ref = session.metadata?.ref;
  console.info(
    `[stripe] ${event.type} livemode=${event.livemode} object=${session.object} kind=${kind ?? "-"} ref=${ref ?? "-"} status=${session.status ?? "-"} payment_status=${session.payment_status ?? "-"}`,
  );
  if (!kind || !ref) return Response.json({ ignored: true });

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        // A 100% promotion code completes the checkout with nothing to charge. Depending on the API version
        // Stripe reports that as "no_payment_required" or as "paid" with a zero total and no payment intent.
        const free = session.payment_status === "no_payment_required" || session.amount_total === 0;
        if (session.payment_status !== "paid" && !free) break;
        const paymentIntent =
          (typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id) ?? null;
        if (!paymentIntent && !free) break;
        const outcome =
          kind === "bundle"
            ? await fulfillBundle(ref, session.id, paymentIntent, session.amount_total, session.amount_subtotal)
            : kind === "bid"
            ? await fulfillBid(ref, session.id, paymentIntent)
            : kind === "badge"
              ? await fulfillBadge(ref, session.id, paymentIntent)
              : "unknown kind";
        console.info(`[stripe] ${kind} ${ref} -> ${outcome}`);
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed":
        await expireCheckout(kind, ref);
        break;
    }
  } catch (error) {
    console.error(`[stripe] could not handle ${event.type}`, error);
    // A 500 makes Stripe retry; every handler is idempotent.
    return new Response("Handler failed", { status: 500 });
  }

  return Response.json({ received: true });
}
