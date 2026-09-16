"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { site } from "@/lib/config";
import { dict, locale } from "@/lib/i18n";
import { spotById, spots } from "@/lib/spots";
import { useAuction } from "../auction-provider";
import { useMoney } from "../money";
import { TeePhoto } from "../tee-photo";
import { LeadBuyerBadge } from "./lead-buyer";
import { useNow } from "../ui";

/** "17d 18h" while there are days left, then "18h 31m". */
function countdown(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(totalMinutes / 1440);
  const h = Math.floor((totalMinutes % 1440) / 60);
  const m = totalMinutes % 60;
  const pad = (v: number) => String(v).padStart(2, "0");
  return d > 0 ? `${d}d ${pad(h)}h` : `${pad(h)}h ${pad(m)}m`;
}

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 14, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export function Hero() {
  const { state, hereNow, highlight, setHighlight, openSpot } = useAuction();
  const { lang, money } = useMoney();
  const t = dict(lang).home;
  const now = useNow(30_000);
  const reduce = useReducedMotion();
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    // Count each browser once, ever; later visits only read the total.
    const KEY = "otb.counted";
    let counted = false;
    try {
      counted = localStorage.getItem(KEY) === "1" || sessionStorage.getItem(KEY) === "1";
    } catch {}
    fetch("/api/views", { method: "POST", body: JSON.stringify({ counted }) })
      .then((r) => r.json())
      .then((d: { views: number | null }) => {
        setViews(d.views);
        try {
          localStorage.setItem(KEY, "1");
        } catch {}
      })
      .catch(() => {});
  }, []);

  const { raised } = state.totals;
  const goal = state.totals.goal;
  const pct = Math.min(100, (raised / goal) * 100);
  const closesIn = now ? Date.parse(site.auction.closesAt) - now : null;
  const closed = state.closed || (closesIn !== null && closesIn <= 0);
  const openSpots = spots.filter((s) => !state.spots[s.id]?.leader).length;
  const n = (v: number) => new Intl.NumberFormat(locale(lang), { useGrouping: "always" }).format(v);

  const presence = [hereNow !== null ? t.online(n(hereNow)) : null, views !== null ? t.visitors(n(views)) : null].filter(Boolean).join(" · ");

  return (
    <section className="mx-auto max-w-5xl px-4 pt-6 pb-16 text-center sm:px-6">
      <motion.p {...rise(0)} className="flex min-h-5 items-center justify-center gap-2 text-[14px] text-ink-2">
        {presence && (
          <>
            <span className="relative inline-flex size-2" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue opacity-40" />
              <span className="relative inline-flex size-2 rounded-full bg-blue" />
            </span>
            {presence}
          </>
        )}
      </motion.p>

      <motion.h1
        {...rise(0.06)}
        className="mx-auto mt-4 max-w-[20ch] text-[36px] leading-[1.02] font-medium tracking-[-0.04em] sm:max-w-none sm:text-[60px] lg:text-[68px]"
      >
        {t.title}
      </motion.h1>

      <motion.p {...rise(0.12)} className="mx-auto mt-5 max-w-3xl text-[17px] leading-[1.9] text-ink-2 sm:text-[21px]">
        {t.subtitle.map((part, i) =>
          "href" in part && part.href ? (
            <a
              key={i}
              href={part.href}
              target="_blank"
              rel="noopener"
              className="group inline-flex items-center gap-1.5 rounded-[5px] bg-snow py-0.5 pr-1.5 pl-1 align-baseline font-semibold whitespace-nowrap text-ink transition-colors hover:bg-line"
            >
              {part.chip}
              <span aria-hidden="true" className="text-[0.8em] text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                ↗
              </span>
            </a>
          ) : part.chip ? (
            <mark key={i} className="rounded-[5px] bg-snow px-1.5 py-0.5 font-semibold whitespace-nowrap text-ink">
              {part.chip}
            </mark>
          ) : (
            <span key={i}>{part.text}</span>
          ),
        )}
      </motion.p>

      <LeadBuyerBadge />

      <motion.div {...rise(0.2)} className="mx-auto mt-8 flex max-w-[860px] items-start justify-center gap-3 sm:gap-8">
        <figure className="min-w-0 flex-[3.4]">
          <TeePhoto
            side="front"
            fixed
            states={state.spots}
            highlight={highlight}
            onHover={setHighlight}
            onSelect={openSpot}
            priority
            className="w-full bg-paper"
          />
          <figcaption className="mt-2 font-mono text-[11px] tracking-[0.08em] text-ink-3 uppercase">{t.front}</figcaption>
        </figure>

        {/* The two sleeves, stacked between the body shots. */}
        <div className="flex min-w-0 flex-[0.62] flex-col gap-[8%] pt-[10%]">
          {(["S1", "S2"] as const).map((id) => (
            <figure key={id}>
              <TeePhoto
                side="front"
                fixed
                locate={id}
                states={state.spots}
                highlight={highlight}
                onHover={setHighlight}
                onSelect={openSpot}
                className="w-full rounded-lg bg-paper"
              />
              <figcaption className="mt-1 font-mono text-[9px] leading-tight tracking-[0.06em] text-ink-3 uppercase sm:text-[10px]">
                {spotById.get(id)?.name[lang]}
              </figcaption>
            </figure>
          ))}
        </div>

        <figure className="min-w-0 flex-[3.4]">
          <TeePhoto
            side="back"
            fixed
            states={state.spots}
            highlight={highlight}
            onHover={setHighlight}
            onSelect={openSpot}
            priority
            className="w-full bg-paper"
          />
          <figcaption className="mt-2 font-mono text-[11px] tracking-[0.08em] text-ink-3 uppercase">{t.back}</figcaption>
        </figure>
      </motion.div>

      <motion.div {...rise(0.28)} className="tabular mx-auto mt-12 max-w-3xl text-left">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <p className="text-[18px] text-ink-2">
            <span className="text-[30px] font-semibold tracking-tight text-green sm:text-[36px]">{money(raised)}</span> {t.raisedOf} {money(goal)}
          </p>
          <p className="pb-1.5 text-[14px] text-ink-2">{t.goalNote}</p>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-snow"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={goal}
          aria-valuenow={raised}
        >
          <motion.div
            className="h-full rounded-full bg-green"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(pct, raised > 0 ? 1.5 : 0)}%` }}
            transition={{ duration: reduce ? 0 : 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <p className="mt-3 text-center text-[15px] text-ink-2">
          {closed ? (
            <span className="font-semibold text-ink">{t.closed}</span>
          ) : (
            <>
              {t.endsIn} <span className="font-semibold text-ink">{closesIn === null ? "…" : countdown(closesIn)}</span>
            </>
          )}{" "}
          · {t.endsAt} · {t.spotsOpen(openSpots, spots.length)}
        </p>
      </motion.div>
    </section>
  );
}
