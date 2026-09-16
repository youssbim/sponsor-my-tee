import type { Metadata } from "next";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { isClosed } from "@/lib/config";
import { biddingEnabled, hasStripe, hasSupabase, useDevStore, useMockPayments } from "@/lib/env";
import { formatMoney } from "@/lib/format";
import { spotById, spots } from "@/lib/spots";
import { getStore } from "@/lib/store";
import type { BidRow } from "@/lib/types";
import { MANUAL } from "@/lib/fulfill";
import { approveAction, logoutAction, rejectAction, retryRefundsAction, toggleBadgeHiddenAction } from "./actions";
import { GoalForm, LogoScaleControl, LoginForm, RemoveSponsorButton, SponsorForm } from "./admin-forms";

export const metadata: Metadata = { title: "Admin · One White Tee", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const eur = (n: number) => formatMoney(n, "en");
const when = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Rome" }).format(new Date(iso)) : "—";

const statusTone: Record<BidRow["status"], string> = {
  active: "bg-green-soft text-green",
  outbid: "bg-snow text-ink-2",
  pending: "bg-amber-soft text-amber",
  rejected: "bg-red/10 text-red",
  expired: "bg-snow text-ink-3",
};

export default async function AdminPage() {
  if (!adminConfigured()) {
    return <p className="p-10 text-[15px]">Set ADMIN_PASSWORD to enable the admin.</p>;
  }
  if (!(await isAdmin())) return <LoginForm />;

  const store = getStore();
  if (!store) {
    const missing = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY"].filter((name) => !process.env[name]);
    return (
      <div className="mx-auto max-w-lg p-10 text-[15px]">
        <h1 className="text-[22px] font-semibold tracking-tight">Database non collegato</h1>
        <p className="mt-2 text-ink-2">Su questo deploy mancano queste variabili d&apos;ambiente:</p>
        <ul className="mt-3 grid gap-1 font-mono text-[13px]">
          {missing.map((name) => (
            <li key={name} className="rounded-lg bg-snow px-3 py-2">{name}</li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] text-ink-3">Aggiungile su Vercel (Settings → Environment Variables → Production) e rifai il deploy.</p>
      </div>
    );
  }

  const [bids, claims, goal] = await Promise.all([
    Promise.all(spots.map((s) => store.listBidsForSpot(s.id))).then((all) => all.flat()),
    store.listBadgeClaims(),
    store.getGoal(),
  ]);
  const closed = isClosed();
  const paid = bids.filter((b) => b.status !== "pending" && b.status !== "expired");
  const review = paid.filter((b) => !b.approved_at && (b.status === "active" || b.status === "outbid"));
  const owedRefunds = paid.filter((b) => (b.status === "outbid" || b.status === "rejected") && b.stripe_payment_intent && !b.refunded_at);
  const leading = paid.filter((b) => b.status === "active");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[28px] font-semibold tracking-tight">Admin</h1>
        <form action={logoutAction}>
          <button className="text-[13px] text-ink-2 hover:text-ink">Sign out</button>
        </form>
      </div>

      <dl className="tabular mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-ink-2">
        <div>Bidding: <strong className="text-ink">{biddingEnabled ? (closed ? "closed" : "open") : "disabled"}</strong></div>
        <div>Store: <strong className="text-ink">{hasSupabase ? "Supabase" : useDevStore ? "local file" : "none"}</strong></div>
        <div>Payments: <strong className="text-ink">{hasStripe ? "Stripe" : useMockPayments ? "mock" : "none"}</strong></div>
        <div>Leading total: <strong className="text-ink">{eur(leading.reduce((s, b) => s + b.amount, 0))}</strong></div>
        <GoalForm goal={goal} />
      </dl>

      {owedRefunds.length > 0 && (
        <section className="mt-8 rounded-2xl bg-amber-soft p-4 text-[14px] text-amber">
          <p className="font-medium">{owedRefunds.length} refund(s) failed or are still pending.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[...new Set(owedRefunds.map((b) => b.spot_id))].map((spotId) => (
              <form key={spotId} action={retryRefundsAction}>
                <input type="hidden" name="spotId" value={spotId} />
                <button className="h-7 rounded-full bg-paper px-3 text-[12px] font-medium text-ink">Retry refunds on {spotId}</button>
              </form>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-[18px] font-semibold">Spazi</h2>
        <p className="mt-1 text-[13px] text-ink-2">Imposta, sostituisci o libera lo sponsor di ogni spazio. Gli sponsor inseriti qui risultano già pagati e approvati.</p>
        <div className="mt-3 divide-y divide-line rounded-2xl border border-line">
          {spots.map((spot) => {
            const holder = leading.find((b) => b.spot_id === spot.id);
            return (
              <div key={spot.id} className="grid gap-3 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-md bg-tee px-1.5 py-0.5 font-mono text-[11px] font-medium text-paper">{spot.id}</span>
                  <span className="text-[14px] font-semibold">{spot.name.it}</span>
                  <span className="font-mono text-[12px] text-ink-3">
                    {spot.w}×{spot.h} cm · da {eur(spot.min)}
                  </span>
                  <span className="ml-auto flex items-center gap-2">
                    {holder ? (
                      <>
                        <span className="grid h-8 w-14 place-items-center rounded-md border border-line bg-card p-1">
                          {/* eslint-disable-next-line @next/next/no-img-element -- uploaded logo */}
                          <img src={store.logoUrl(holder.logo_path)} alt="" className="max-h-full max-w-full object-contain" />
                        </span>
                        <span className="text-[13px] font-medium">{holder.brand}</span>
                        <span className="tabular text-[13px]">{eur(holder.amount)}</span>
                        <span className="rounded-full bg-snow px-2 py-0.5 text-[11px] text-ink-2">
                          {holder.stripe_session_id === MANUAL ? "manuale" : holder.approved_at ? "Stripe" : "Stripe · da approvare"}
                        </span>
                        <RemoveSponsorButton id={holder.id} brand={holder.brand} />
                      </>
                    ) : (
                      <span className="text-[13px] text-ink-3">Libero</span>
                    )}
                  </span>
                </div>
                {holder && (
                  <LogoScaleControl
                    key={`${holder.id}-${holder.logo_scale}-${holder.logo_offset_x}-${holder.logo_offset_y}`}
                    id={holder.id}
                    spotId={spot.id}
                    brand={holder.brand}
                    logoUrl={store.logoUrl(holder.logo_path)}
                    scale={holder.logo_scale ?? 100}
                    offsetX={holder.logo_offset_x ?? 0}
                    offsetY={holder.logo_offset_y ?? 0}
                  />
                )}
                <SponsorForm spotId={spot.id} min={spot.min} replacing={Boolean(holder)} />
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-[18px] font-semibold">Needs review ({review.length})</h2>
        {review.length === 0 ? (
          <p className="mt-2 text-[14px] text-ink-2">Nothing to review.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {review.map((bid) => (
              <article key={bid.id} id={`bid-${bid.id}`} className="grid gap-3 rounded-2xl border border-line p-4">
                <div className="grid aspect-[7/4] place-items-center rounded-xl border border-line bg-card p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element -- uploaded logo */}
                  <img src={store.logoUrl(bid.logo_path)} alt="" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="text-[13px]">
                  <p className="text-[15px] font-semibold">{bid.brand}</p>
                  <p className="text-ink-2">
                    {bid.spot_id} {spotById.get(bid.spot_id)?.name.en} · {eur(bid.amount)} · {bid.status}
                  </p>
                  <p className="truncate text-ink-2">{bid.url ?? "no website"} · {bid.x_handle ? `@${bid.x_handle}` : "no X"}</p>
                  <p className="truncate text-ink-2">{bid.email}</p>
                </div>
                <div className="flex gap-2">
                  <form action={approveAction}>
                    <input type="hidden" name="id" value={bid.id} />
                    <button className="h-8 rounded-full bg-green px-4 text-[13px] font-medium text-paper">Approve</button>
                  </form>
                  <form action={rejectAction}>
                    <input type="hidden" name="id" value={bid.id} />
                    <button className="h-8 rounded-full bg-snow px-4 text-[13px] font-medium text-red">Reject & refund</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-[18px] font-semibold">All bids</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
          <table className="tabular w-full min-w-[900px] text-left text-[13px]">
            <thead className="bg-snow text-[12px] text-ink-2">
              <tr>
                <th className="px-3 py-2 font-medium">Spot</th>
                <th className="px-3 py-2 font-medium">Brand</th>
                <th className="px-3 py-2 font-medium">Bid</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Approved</th>
                <th className="px-3 py-2 font-medium">Refund</th>
                <th className="px-3 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {bids
                .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
                .map((bid) => (
                  <tr key={bid.id} id={`row-${bid.id}`}>
                    <td className="px-3 py-2 font-mono">{bid.spot_id}</td>
                    <td className="px-3 py-2">
                      <p className="font-medium">{bid.brand}</p>
                      <p className="text-[12px] text-ink-3">{bid.email}</p>
                    </td>
                    <td className="px-3 py-2">
                      {eur(bid.amount)}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone[bid.status]}`}>{bid.status}</span>
                    </td>
                    <td className="px-3 py-2">{bid.approved_at ? "yes" : "—"}</td>
                    <td className="px-3 py-2">{bid.refunded_at ? when(bid.refunded_at) : "—"}</td>
                    <td className="px-3 py-2">{when(bid.created_at)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-[18px] font-semibold">Badge</h2>
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line">
          {claims
            .filter((c) => c.status !== "expired")
            .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
            .map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-[13px]">
                <span className="min-w-0 flex-1 truncate font-medium">
                  {c.label} <span className="text-ink-3">· {c.url ?? (c.x_handle ? `@${c.x_handle}` : "no link")} · {c.email}</span>
                </span>
                <span className="tabular">{eur(c.amount)}</span>
                <span className="text-ink-2">{c.status}</span>
                {c.status === "held" && (
                  <form action={toggleBadgeHiddenAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="h-7 rounded-full bg-snow px-3 text-[12px] font-medium">{c.hidden ? "Unhide" : "Hide"}</button>
                  </form>
                )}
              </li>
            ))}
        </ul>
      </section>
    </main>
  );
}
