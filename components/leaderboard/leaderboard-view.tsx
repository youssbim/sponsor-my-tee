"use client";

import Link from "next/link";
import { dayKey, formatDay, formatSize, formatSpan, formatTime } from "@/lib/format";
import { dict, localePath } from "@/lib/i18n";
import { spotById, spots } from "@/lib/spots";
import type { PublicBid } from "@/lib/types";
import { useAuction } from "../auction-provider";
import { useMoney } from "../money";
import { BrandMark, Chip, useNow } from "../ui";

export function LeaderboardView() {
  const { state } = useAuction();
  const { lang, money } = useMoney();
  const t = dict(lang);
  const now = useNow(60_000);

  const ranked = [...spots].sort((a, b) => {
    const la = state.spots[a.id]?.leader?.amount ?? 0;
    const lb = state.spots[b.id]?.leader?.amount ?? 0;
    return lb - la || a.id.localeCompare(b.id, "en", { numeric: true });
  });
  const podium = ranked.filter((s) => state.spots[s.id]?.leader).slice(0, 3);

  const days = new Map<string, PublicBid[]>();
  for (const bid of state.recent) {
    const key = dayKey(bid.at);
    days.set(key, [...(days.get(key) ?? []), bid]);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pt-12 sm:px-6">
      <Link href={localePath(lang, "/")} className="text-[14px] text-blue hover:underline">
        ← {t.leaderboard.back}
      </Link>
      <h1 className="mt-4 text-[40px] font-semibold tracking-[-0.03em] sm:text-[52px]">{t.leaderboard.title}</h1>
      <p className="mt-2 text-[17px] text-ink-2">{t.leaderboard.lead}</p>

      <dl className="tabular mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[14px] text-ink-2">
        <div>
          <dt className="sr-only">{t.hero.raised}</dt>
          <dd>
            <strong className="text-ink">{money(state.totals.raised)}</strong> {t.hero.raised}
          </dd>
        </div>
        <div>
          <dt className="sr-only">{t.hero.bids}</dt>
          <dd>
            <strong className="text-ink">{state.totals.bids}</strong> {t.hero.bids}
          </dd>
        </div>
        <div>
          <dt className="sr-only">{t.hero.taken}</dt>
          <dd>
            <strong className="text-ink">
              {state.totals.taken}/{state.totals.spots}
            </strong>{" "}
            {t.hero.taken}
          </dd>
        </div>
      </dl>

      {podium.length > 0 && (
        <section className="mt-12" aria-labelledby="top-title">
          <h2 id="top-title" className="text-[22px] font-semibold tracking-tight">
            {t.leaderboard.top}
          </h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {podium.map((spot, i) => {
              const leader = state.spots[spot.id].leader!;
              return (
                <li key={spot.id} className="rounded-3xl border border-line bg-card p-5">
                  <p className="flex items-center justify-between text-[12px] text-ink-2">
                    <span className="font-mono">#{i + 1}</span>
                    <span className="font-mono">
                      {spot.id} · {formatSize(spot, lang)}
                    </span>
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    <BrandMark name={leader.brand ?? "?"} logoUrl={leader.logoUrl} url={leader.url} xHandle={leader.xHandle} size={44} dark />
                    <div className="min-w-0">
                      <p className="truncate text-[16px] font-semibold">{leader.brand ?? t.spots.inReview}</p>
                      <p className="truncate text-[13px] text-ink-2">{spot.name[lang]}</p>
                    </div>
                  </div>
                  <p className="tabular mt-5 text-[28px] font-semibold tracking-tight">{money(leader.amount)}</p>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section className="mt-12" aria-labelledby="table-title">
        <h2 id="table-title" className="text-[22px] font-semibold tracking-tight">
          {t.leaderboard.table}
        </h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
          <table className="tabular w-full min-w-[560px] text-left text-[14px]">
            <thead className="bg-snow text-[12px] text-ink-2">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t.leaderboard.colSpot}</th>
                <th className="px-4 py-2.5 font-medium">{t.leaderboard.colSize}</th>
                <th className="px-4 py-2.5 font-medium">{t.leaderboard.colHolder}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t.leaderboard.colBid}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t.leaderboard.colBids}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ranked.map((spot) => {
                const s = state.spots[spot.id];
                return (
                  <tr key={spot.id}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[12px] text-ink-2">{spot.id}</span>{" "}
                      <span className="font-medium">{spot.name[lang]}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-ink-2">{formatSize(spot, lang)}</td>
                    <td className="px-4 py-3">
                      {s?.leader ? (
                        <span className="flex items-center gap-2">
                          <BrandMark name={s.leader.brand ?? "?"} logoUrl={s.leader.logoUrl} url={s.leader.url} xHandle={s.leader.xHandle} size={22} dark />
                          <span className="truncate">{s.leader.brand ?? t.spots.inReview}</span>
                        </span>
                      ) : (
                        <span className="text-ink-3">{s?.open ? t.leaderboard.noHolder : t.spots.locked}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{s?.leader ? money(s.leader.amount) : "—"}</td>
                    <td className="px-4 py-3 text-right text-ink-2">{s?.bidCount ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {days.size > 0 && (
        <section className="mt-12" aria-labelledby="days-title">
          <h2 id="days-title" className="text-[22px] font-semibold tracking-tight">
            {t.leaderboard.days}
          </h2>
          <div className="mt-4 grid gap-6">
            {[...days.entries()].map(([key, bids]) => (
              <div key={key}>
                <h3 className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2">
                  <span className="text-[15px] font-semibold capitalize">{formatDay(bids[0].at, lang)}</span>
                  <span className="tabular text-[13px] text-ink-2">
                    {t.leaderboard.dayTotal(bids.length, money(bids.reduce((sum, b) => sum + b.amount, 0)))}
                  </span>
                </h3>
                <ul className="divide-y divide-line">
                  {bids.map((bid) => (
                    <li key={bid.id} className="flex items-center gap-3 py-2.5 text-[14px]">
                      <span className="tabular w-11 shrink-0 text-[12px] text-ink-3">{formatTime(bid.at, lang)}</span>
                      <BrandMark name={bid.brand ?? "?"} logoUrl={bid.logoUrl} url={bid.url} xHandle={bid.xHandle} size={24} dark />
                      <span className="min-w-0 flex-1 truncate">
                        {bid.brand ?? t.recent.reviewing}{" "}
                        <span className="text-ink-3">
                          · <span className="font-mono">{bid.spotId}</span> {spotById.get(bid.spotId)?.name[lang]}
                        </span>
                      </span>
                      {bid.standing ? <Chip tone="green">{t.recent.standing}</Chip> : <Chip>{t.recent.beaten}</Chip>}
                      <span className="tabular w-16 shrink-0 text-right font-semibold">{money(bid.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {state.badge.history.length > 0 && (
        <section className="mt-12" aria-labelledby="badge-title">
          <h2 id="badge-title" className="text-[22px] font-semibold tracking-tight">
            {t.badge.historyTitle}
          </h2>
          <ul className="mt-4 divide-y divide-line rounded-2xl border border-line">
            {state.badge.history.map((h) => (
              <li key={h.id} className="flex items-center gap-3 px-4 py-3 text-[14px]">
                <BrandMark name={h.label} url={h.url} xHandle={h.xHandle} size={28} />
                <span className="min-w-0 flex-1 truncate font-medium">{h.label}</span>
                <span className="tabular text-[13px] text-ink-2">
                  {h.until ? formatSpan(Date.parse(h.until) - Date.parse(h.since)) : now ? formatSpan(now - Date.parse(h.since)) : ""}
                </span>
                <span className="tabular w-16 text-right font-semibold">{money(h.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
