import { notFound, redirect } from "next/navigation";
import { useMockPayments } from "@/lib/env";
import { expireCheckout, fulfillBadge, fulfillBid, fulfillBundle } from "@/lib/fulfill";

// Stand-in for Stripe Checkout while developing without Stripe keys.

type Search = { session?: string; kind?: string; ref?: string; amount?: string; title?: string; success?: string; cancel?: string };

function sameOrigin(url: string | undefined) {
  if (!url) return "/";
  try {
    const parsed = new URL(url, "http://localhost");
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return "/";
  }
}

export default async function DevCheckout({ searchParams }: { searchParams: Promise<Search> }) {
  if (!useMockPayments) notFound();
  const q = await searchParams;

  async function pay() {
    "use server";
    if (!useMockPayments || !q.ref || !q.session) return;
    const intent = `mock_pi_${crypto.randomUUID()}`;
    if (q.kind === "bundle") await fulfillBundle(q.ref, q.session, intent, null, null);
    else if (q.kind === "bid") await fulfillBid(q.ref, q.session, intent);
    else if (q.kind === "badge") await fulfillBadge(q.ref, q.session, intent);
    redirect(sameOrigin(q.success));
  }

  async function payWithCoupon() {
    "use server";
    if (!useMockPayments || !q.ref || !q.session) return;
    if (q.kind === "bundle") await fulfillBundle(q.ref, q.session, null, 0, null);
    else if (q.kind === "bid") await fulfillBid(q.ref, q.session, null);
    else if (q.kind === "badge") await fulfillBadge(q.ref, q.session, null);
    redirect(sameOrigin(q.success));
  }

  async function cancel() {
    "use server";
    if (!useMockPayments || !q.ref || !q.kind) return;
    await expireCheckout(q.kind, q.ref);
    redirect(sameOrigin(q.cancel));
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-snow px-4">
      <div className="w-full max-w-sm rounded-3xl bg-paper p-7 shadow-xl">
        <p className="inline-flex rounded-full bg-amber-soft px-2.5 py-1 text-[11px] font-medium text-amber">Test checkout · no real money</p>
        <h1 className="mt-4 text-[17px] font-semibold leading-snug">{q.title}</h1>
        <p className="tabular mt-3 text-[34px] font-semibold tracking-tight">€{q.amount}</p>
        <p className="mt-1 font-mono text-[11px] break-all text-ink-3">{q.session}</p>
        <form className="mt-6 grid gap-2">
          <button formAction={pay} className="h-11 rounded-full bg-ink text-[15px] font-medium text-paper">
            Pay (simulated)
          </button>
          <button formAction={payWithCoupon} className="h-11 rounded-full border border-line text-[14px] font-medium text-ink hover:bg-snow">
            Coupon 100% (€0)
          </button>
          <button formAction={cancel} className="h-11 rounded-full text-[14px] text-ink-2 hover:bg-snow">
            Cancel
          </button>
        </form>
      </div>
    </main>
  );
}
