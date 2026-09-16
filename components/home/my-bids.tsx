"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { dict } from "@/lib/i18n";
import { spotById } from "@/lib/spots";
import type { BidStatus } from "@/lib/types";
import { useAuction } from "../auction-provider";
import { useMoney } from "../money";
import { Chip, useNow } from "../ui";

const tone: Record<BidStatus, "green" | "amber" | "neutral"> = {
  active: "green",
  outbid: "amber",
  pending: "neutral",
  rejected: "neutral",
  expired: "neutral",
};

/** Floating summary of this browser's bids. */
export function MyBids() {
  const { myBids, state, openBid } = useAuction();
  const { lang, money } = useMoney();
  const t = dict(lang).mine;
  const [open, setOpen] = useState(false);
  const now = useNow(60_000);

  // Unpaid checkouts disappear after the 30 minutes Stripe keeps them open.
  const visible = myBids.filter(
    (b) => b.status !== "pending" || (now !== null && now - Date.parse(b.createdAt) < 30 * 60_000),
  );
  if (visible.length === 0) return null;

  const leading = visible.filter((b) => b.status === "active").length;
  const outbid = visible.filter(
    (b) => b.status === "outbid" && !visible.some((o) => o.spotId === b.spotId && o.status === "active"),
  ).length;

  const label = (status: BidStatus) =>
    ({ active: t.leading, outbid: t.outbid, pending: t.pending, rejected: t.rejected, expired: t.expired })[status];

  return (
    <div className="fixed right-4 bottom-20 z-30 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2 lg:bottom-auto lg:top-20">
      <AnimatePresence>
        {open && (
          <motion.div
            id="my-bids"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="w-80 max-w-full overflow-hidden rounded-2xl border border-line bg-paper shadow-xl"
          >
            <p className="border-b border-line px-4 py-3 text-[13px] font-semibold">{t.title}</p>
            <ul className="max-h-72 divide-y divide-line overflow-y-auto">
              {visible.map((bid) => {
                const spot = spotById.get(bid.spotId);
                const canRebid = bid.status === "outbid" && state.spots[bid.spotId]?.open && !state.closed;
                return (
                  <li key={bid.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">
                        <span className="font-mono">{bid.spotId}</span> · {spot?.name[lang]}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5">
                        <span className="tabular text-[12px] text-ink-2">{money(bid.amount)}</span>
                        <Chip tone={tone[bid.status]}>{label(bid.status)}</Chip>
                      </p>
                    </div>
                    {canRebid && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          openBid(bid.spotId);
                        }}
                        className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-[12px] font-medium text-paper"
                      >
                        {t.bidAgain}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="my-bids"
        onClick={() => setOpen((o) => !o)}
        className="tabular flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[13px] font-medium text-paper shadow-lg"
      >
        {t.title}
        {leading > 0 && <span className="rounded-full bg-green px-1.5 text-[11px]">{leading}</span>}
        {outbid > 0 && <span className="rounded-full bg-amber px-1.5 text-[11px]">{outbid}</span>}
      </button>
    </div>
  );
}
