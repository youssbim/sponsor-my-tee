"use client";

import Image from "next/image";
import { formatSize } from "@/lib/format";
import { dict } from "@/lib/i18n";
import { spotById, spots, type Side, type Spot } from "@/lib/spots";
import type { SpotState } from "@/lib/types";
import { useAuction } from "../auction-provider";
import { useMoney } from "../money";
import { TeePhoto } from "../tee-photo";
import { BrandMark } from "../ui";
import { Eyebrow } from "./section";

export function SpotTables() {
  const { lang } = useMoney();
  const t = dict(lang).home;
  const tables: { side: Side; title: string }[] = [
    { side: "front", title: t.frontTable },
    { side: "back", title: t.backTable },
  ];

  return (
    <section id="spots" className="mx-auto max-w-5xl px-4 pt-16 sm:px-6" aria-labelledby="spots-title">
      <Eyebrow>{t.spotsEyebrow}</Eyebrow>
      <h2 id="spots-title" className="mt-1 text-[32px] font-medium tracking-[-0.03em] sm:text-[36px]">
        {t.spotsTitle}
      </h2>
      <p className="mt-1 max-w-[42ch] text-[17px] leading-snug text-ink-2">{t.spotsLead}</p>

      <div className="mt-8 grid gap-6">
        {tables.map((table) => (
          <div key={table.side} className="overflow-hidden rounded-xl border border-line bg-card">
            <h3 className="border-b border-line bg-paper px-4 py-3 text-[11px] font-semibold tracking-[0.1em] text-ink-2 uppercase">
              {table.title}
            </h3>
            <ul className="divide-y divide-line">
              {spots
                .filter((s) => s.side === table.side)
                .map((spot, i) => (
                  <li key={spot.id}>
                    <SpotRow spot={spot} index={i + 1} />
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function SpotRow({ spot, index }: { spot: Spot; index: number }) {
  const { state, openSpot, highlight, setHighlight, myBids } = useAuction();
  const { lang, money } = useMoney();
  const t = dict(lang).home;
  const s: SpotState = state.spots[spot.id];
  const leader = s?.leader ?? null;
  const next = s?.nextMin ?? spot.min;
  const tag = t.tags[spot.id];
  const mine = myBids.some((b) => b.spotId === spot.id && b.status === "active");

  return (
    <button
      type="button"
      id={`spot-${spot.id}`}
      onClick={() => openSpot(spot.id)}
      onPointerEnter={() => setHighlight(spot.id)}
      onPointerLeave={() => setHighlight(null)}
      className={`group grid w-full grid-cols-[72px_1fr] gap-x-4 gap-y-3 p-4 text-left transition-colors hover:bg-paper disabled:cursor-default sm:grid-cols-[88px_1fr_auto] ${
        highlight === spot.id ? "bg-paper" : ""
      }`}
    >
      {/* Where the spot sits on the tee. */}
      <span className="self-start overflow-hidden rounded-lg border border-line bg-white sm:self-center">
        <TeePhoto side={spot.side} fixed static states={{ [spot.id]: s }} locate={spot.id} className="w-full" />
      </span>

      <span className="min-w-0 self-center">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono text-[11px] font-semibold text-ink-3">{String(index).padStart(2, "0")}</span>
          <span className="text-[16px] font-semibold tracking-tight">{spot.name[lang]}</span>
          {tag && <span className="rounded bg-blue-soft px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-blue">{tag}</span>}
        </span>
        <span className="mt-1 block text-[13px] leading-snug text-ink-2">{spot.seen[lang]}</span>
        <span className="mt-1.5 block font-mono text-[11px] text-ink-3">{formatSize(spot, lang)}</span>
      </span>

      <span className="col-start-2 flex flex-col gap-2 self-center sm:col-start-3 sm:w-60 sm:items-end">
        {leader ? (
          <>
            <span className="flex items-center gap-2 sm:justify-end">
              <BrandMark name={leader.brand ?? "?"} logoUrl={leader.logoUrl} url={leader.url} xHandle={leader.xHandle} size={22} dark />
              <span className="min-w-0 text-[12px] text-ink-2">
                {t.holds} <span className="font-semibold text-ink">{leader.brand ?? t.inReview}</span>
                {mine && " ★"}
              </span>
              <span className="tabular text-[13px] font-semibold text-blue">{money(leader.amount)}</span>
            </span>
            <span className="tabular inline-flex h-10 items-center justify-center rounded-full bg-ink px-4 text-[14px] font-semibold whitespace-nowrap text-paper transition-transform group-hover:-translate-y-px group-disabled:opacity-40">
              🔥 {t.steal(money(next))}
            </span>
          </>
        ) : (
          <>
            <span className="flex items-baseline gap-2 sm:justify-end">
              <span className="rounded bg-green-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-green uppercase">{t.available}</span>
              <span className="tabular text-[18px] font-bold text-green">{money(spot.min)}</span>
            </span>
            <span className="tabular inline-flex h-10 items-center justify-center rounded-full border border-ink px-4 text-[14px] font-semibold whitespace-nowrap text-ink transition-colors group-hover:bg-ink group-hover:text-paper group-disabled:opacity-40">
              {t.grab(money(spot.min))}
            </span>
          </>
        )}
      </span>
    </button>
  );
}

const FEATURED = "F3";

export function FeaturedSpot() {
  const { state, openBid } = useAuction();
  const { lang, money } = useMoney();
  const t = dict(lang).home;
  const spot = spotById.get(FEATURED)!;
  const s = state.spots[FEATURED];

  return (
    <section className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
      <div className="grid items-center gap-8 rounded-xl border border-line bg-card p-6 sm:p-8 md:grid-cols-[1fr_auto]">
        <div>
          <Eyebrow>{t.featuredEyebrow}</Eyebrow>
          <h2 className="mt-2 text-[28px] font-medium tracking-[-0.03em] sm:text-[34px]">{t.featuredTitle(money(spot.min))}</h2>
          <p className="mt-3 max-w-[58ch] text-[17px] leading-relaxed text-ink-2">{t.featuredBody}</p>
          <ul className="mt-4 space-y-2 text-[15px]">
            {t.featuredPerks.map((perk) => (
              <li key={perk} className="flex gap-2.5">
                <span className="text-blue" aria-hidden="true">
                  ★
                </span>
                {perk}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[15px] text-ink-2">{t.featuredNote}</p>
        </div>
        <button
          type="button"
          disabled={state.closed}
          onClick={() => openBid(FEATURED)}
          className="tabular h-12 justify-self-start rounded-full bg-ink px-6 text-[15px] font-semibold text-paper transition-opacity hover:opacity-85 disabled:opacity-40 md:justify-self-end"
        >
          {state.closed ? t.closed : t.featuredCta(money(s?.nextMin ?? spot.min))}
        </button>
      </div>
    </section>
  );
}

export function LogoWall() {
  const { state } = useAuction();
  const { lang } = useMoney();
  const t = dict(lang).home;
  const sponsors = spots.flatMap((spot) => {
    const leader = state.spots[spot.id]?.leader;
    return leader?.brand ? [{ spot, leader }] : [];
  });

  return (
    <section className="mx-auto max-w-5xl px-4 pt-20 sm:px-6" aria-labelledby="wall-title">
      <Eyebrow>{t.wallEyebrow}</Eyebrow>
      <h2 id="wall-title" className="mt-1 text-[32px] font-medium tracking-[-0.03em] sm:text-[36px]">
        {t.wallTitle}
      </h2>
      <p className="mt-1 text-[15px] text-ink-2">{sponsors.length === 0 ? t.wallEmpty : t.wallLead}</p>

      <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 text-center sm:grid-cols-3">
        {sponsors.map(({ spot, leader }) => {
          const card = (
            <>
              <span className="mx-auto grid size-20 place-items-center">
                <BrandMark name={leader.brand!} logoUrl={leader.logoUrl} url={leader.url} xHandle={leader.xHandle} size={80} dark />
              </span>
              <span className="mt-2 block text-[15px] font-semibold">{leader.brand}</span>
              <span className="block text-[13px] text-ink-2">
                {spot.side === "front" ? dict(lang).tee.front.toLowerCase() : dict(lang).tee.back.toLowerCase()} · {spot.id} · {spot.name[lang]}
              </span>
            </>
          );
          return (
            <li key={spot.id}>
              {leader.url ? (
                <a href={leader.url} target="_blank" rel="sponsored noopener" className="block transition-opacity hover:opacity-80">
                  {card}
                </a>
              ) : (
                card
              )}
            </li>
          );
        })}
        <li>
          <Image src="/avatar.jpg" alt="" width={80} height={80} className="mx-auto size-20 rounded-full object-cover" />
          <span className="mt-2 block text-[15px] font-semibold">Your Name</span>
          <span className="block text-[13px] text-ink-2">{t.wallMe}</span>
        </li>
      </ul>
    </section>
  );
}
