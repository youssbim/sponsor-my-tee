"use client";

import { formatSize, hostname } from "@/lib/format";
import { dict } from "@/lib/i18n";
import { spotById } from "@/lib/spots";
import { useAuction } from "../auction-provider";
import { useMoney } from "../money";
import { Sheet } from "../sheet";
import { TeePhoto } from "../tee-photo";
import { BrandMark } from "../ui";

/** What you see when you tap a spot someone already holds: who, for how much, their link, and the way to take it. */
export function SponsorDialog() {
  const { state, viewSpot, closeView, openBid } = useAuction();
  const { lang, money } = useMoney();
  const t = dict(lang);
  const spot = viewSpot ? spotById.get(viewSpot) : undefined;
  const s = viewSpot ? state.spots[viewSpot] : undefined;
  const leader = s?.leader ?? null;

  const link = leader?.url
    ? { href: leader.url, label: t.home.visitSite(hostname(leader.url)) }
    : leader?.xHandle
      ? { href: `https://x.com/${leader.xHandle}`, label: t.home.visitX(leader.xHandle) }
      : null;

  return (
    <Sheet open={Boolean(spot && leader)} onClose={closeView} label={leader?.brand ?? t.home.sponsorOf} closeLabel={t.dialog.close}>
      {spot && leader && s && (
        <div className="grid gap-5 p-5 sm:p-7">
          <div className="flex items-center gap-4 pr-10">
            <div className="w-24 shrink-0 overflow-hidden rounded-xl border border-line bg-white">
              <TeePhoto side={spot.side} fixed static states={{ [spot.id]: s }} locate={spot.id} className="w-full" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-semibold tracking-[0.1em] text-ink-3 uppercase">{t.home.sponsorOf}</p>
              <p className="mt-1 text-[15px] font-semibold">
                {spot.name[lang]} <span className="font-mono text-[12px] font-normal text-ink-3">· {spot.id} · {formatSize(spot, lang)}</span>
              </p>
              <p className="mt-0.5 text-[13px] text-ink-2">{spot.seen[lang]}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-line bg-card p-4">
            <BrandMark name={leader.brand ?? "?"} logoUrl={leader.logoUrl} url={leader.url} xHandle={leader.xHandle} size={64} dark />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[20px] font-semibold tracking-tight">{leader.brand ?? t.home.inReview}</p>
              <p className="tabular text-[13px] text-ink-2">
                {t.home.leadingWith(money(leader.amount))} · {t.spots.bidCount(s.bidCount)}
              </p>
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {link && (
              <a
                href={link.href}
                target="_blank"
                rel="sponsored noopener"
                className="inline-flex h-12 items-center justify-center gap-1.5 rounded-full border border-ink px-5 text-[15px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                <span className="truncate">{link.label}</span>
                <span aria-hidden="true">↗</span>
              </a>
            )}
            {!state.closed && (
              <button
                type="button"
                onClick={() => openBid(spot.id)}
                className={`tabular inline-flex h-12 items-center justify-center rounded-full bg-ink px-5 text-[15px] font-semibold text-paper transition-opacity hover:opacity-85 ${link ? "" : "sm:col-span-2"}`}
              >
                🔥 {t.home.steal(money(s.nextMin))}
              </button>
            )}
          </div>

          {!state.closed && <p className="-mt-1 text-center text-[12px] text-ink-3">{t.home.stealNote(leader.brand ?? t.home.inReview)}</p>}
        </div>
      )}
    </Sheet>
  );
}
