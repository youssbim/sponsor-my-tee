"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { dict, locale } from "@/lib/i18n";
import { spotById, spots } from "@/lib/spots";
import type { Visit } from "@/lib/store/types";
import { useAuction } from "../auction-provider";
import { useMoney } from "../money";
import { Sheet } from "../sheet";
import { BrandMark } from "../ui";

function flag(country: string | null) {
  if (!country) return "🌍";
  return String.fromCodePoint(...[...country].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** Total visits and the latest things that happened, bottom right on large screens. */
export function ActivityFeed() {
  const { state } = useAuction();
  const { lang } = useMoney();
  const t = dict(lang).home;
  const [data, setData] = useState<{ views: number | null; visits: Visit[] }>({ views: null, visits: [] });

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/views", { cache: "no-store" })
        .then((r) => r.json())
        .then((d: { views: number | null; visits?: Visit[] }) => {
          if (alive) setData({ views: d.views, visits: d.visits ?? [] });
        })
        .catch(() => {});
    // Give the hero a moment to count this visit first.
    const first = setTimeout(load, 1500);
    const id = setInterval(load, 20_000);
    return () => {
      alive = false;
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const countries = new Intl.DisplayNames([locale(lang)], { type: "region" });
  const time = new Intl.DateTimeFormat(locale(lang), { hour: "2-digit", minute: "2-digit" });
  const events = [
    ...data.visits.map((v) => ({
      key: `v-${v.at}`,
      at: v.at,
      icon: flag(v.country),
      text: v.country ? (countries.of(v.country) ?? v.country) : t.somewhere,
      strong: false,
    })),
    ...state.recent.slice(0, 6).map((b) => ({
      key: `b-${b.id}`,
      at: b.at,
      icon: "★",
      text: `${b.brand ?? t.inReview} · ${spotById.get(b.spotId)?.name[lang] ?? b.spotId}`,
      strong: true,
    })),
  ]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 4);

  if (data.views === null && events.length === 0) return null;

  return (
    <aside aria-label={t.totalVisits} className="fixed right-4 bottom-4 z-20 hidden w-60 lg:block">
      <div className="rounded-2xl border border-line bg-paper/85 p-3.5 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.3)] backdrop-blur-md">
        {data.views !== null && (
          <p className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-ink-3 uppercase">{t.totalVisits}</span>
            <span className="tabular text-[20px] font-semibold tracking-tight text-blue">
              {new Intl.NumberFormat(locale(lang), { notation: "compact", maximumFractionDigits: 1 }).format(data.views)}
            </span>
          </p>
        )}
        <ul className="mt-2 space-y-1.5">
          <AnimatePresence initial={false}>
            {events.map((e) => (
              <motion.li
                key={e.key}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-[12px]"
              >
                <span className={`w-4 shrink-0 text-center ${e.strong ? "text-blue" : ""}`} aria-hidden="true">
                  {e.icon}
                </span>
                <span className={`min-w-0 flex-1 truncate ${e.strong ? "font-medium text-ink" : "text-ink-2"}`}>{e.text}</span>
                <span className="tabular shrink-0 font-mono text-[10px] text-ink-3">{time.format(new Date(e.at))}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </aside>
  );
}

/** Always-visible pill that lists the sponsors first, then the open spots. */
export function SponsorsFab() {
  const { state, openSpot } = useAuction();
  const { lang, money } = useMoney();
  const t = dict(lang).home;
  const [open, setOpen] = useState(false);

  const taken = spots
    .filter((s) => state.spots[s.id]?.leader)
    .sort((a, b) => state.spots[b.id].leader!.amount - state.spots[a.id].leader!.amount);
  const free = spots.filter((s) => !state.spots[s.id]?.leader).sort((a, b) => b.min - a.min);

  const pick = (id: string) => {
    setOpen(false);
    openSpot(id);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-1/2 z-30 flex h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-semibold whitespace-nowrap text-paper shadow-[0_12px_32px_-12px_rgba(0,0,0,0.55)] transition-transform hover:-translate-y-0.5"
      >
        {t.viewSponsors}
        <span className="tabular rounded-full bg-paper/15 px-2 py-0.5 text-[12px]">
          {taken.length}/{spots.length}
        </span>
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} label={t.sponsorsTitle} closeLabel={dict(lang).dialog.close}>
        <div className="p-5 sm:p-6">
          <h2 className="text-[20px] font-semibold tracking-tight">{t.sponsorsTitle}</h2>
          <p className="mt-0.5 text-[13px] text-ink-2">{t.sponsorsLead(taken.length, spots.length)}</p>
          <ul className="mt-4 grid gap-2">
            {[...taken, ...free].map((spot) => {
              const leader = state.spots[spot.id]?.leader ?? null;
              return (
                <li key={spot.id}>
                  <button
                    type="button"
                    onClick={() => pick(spot.id)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-line bg-card p-3 text-left transition-colors hover:border-ink/25 disabled:cursor-default"
                  >
                    {leader ? (
                      <BrandMark name={leader.brand ?? "?"} logoUrl={leader.logoUrl} url={leader.url} xHandle={leader.xHandle} size={44} dark />
                    ) : (
                      <span
                        className="grid size-11 shrink-0 place-items-center rounded-[22%] border border-dashed border-ink/30 text-[18px] text-ink-2"
                        aria-hidden="true"
                      >
                        +
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[10px] font-semibold tracking-[0.08em] text-ink-3 uppercase">
                        {spot.name[lang]} · {spot.id}
                      </span>
                      <span className={`block truncate text-[15px] font-semibold ${leader ? "text-ink" : "text-blue"}`}>
                        {leader ? (leader.brand ?? t.inReview) : t.openSpot}
                      </span>
                    </span>
                    <span className={`tabular shrink-0 text-[15px] font-semibold ${leader ? "text-ink" : "text-green"}`}>
                      {leader ? money(leader.amount) : t.from(money(spot.min))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </Sheet>
    </>
  );
}
