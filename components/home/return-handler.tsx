"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { dict } from "@/lib/i18n";
import { spotById } from "@/lib/spots";
import { useAuction } from "../auction-provider";
import { useMoney } from "../money";
import { Sheet } from "../sheet";

const PARAMS = ["paid", "cancelled", "ref", "spot"];

function clearParams() {
  const url = new URL(window.location.href);
  PARAMS.forEach((key) => url.searchParams.delete(key));
  window.history.replaceState(null, "", url.toString());
}

/** Handles the return from checkout (?paid= / ?cancelled=) and deep links (?spot=). */
export function ReturnHandler() {
  return (
    <Suspense fallback={null}>
      <ReturnDialog />
    </Suspense>
  );
}

function ReturnDialog() {
  const params = useSearchParams();
  const { openBid, refresh, refreshMine, myBids, state } = useAuction();
  const { lang } = useMoney();
  const t = dict(lang).result;
  const [dismissed, setDismissed] = useState(false);

  const paid = params.get("paid");
  const cancelled = params.get("cancelled");
  const ref = params.get("ref");
  const spot = params.get("spot");
  const kind = paid === "bid" || paid === "badge" || paid === "bundle" ? paid : null;
  const open = Boolean(kind && ref && !dismissed);

  // After paying, confirm with Stripe directly (the webhook does the same, whichever lands first).
  useEffect(() => {
    if (!kind || !ref) return;
    void fetch("/api/checkout/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, ref }),
    }).then(() => {
      void refresh();
      void refreshMine();
    });
    const timers = [1500, 4000, 9000].map((ms) =>
      setTimeout(() => {
        void refresh();
        void refreshMine();
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [kind, ref, refresh, refreshMine]);

  useEffect(() => {
    if ((cancelled !== "bid" && cancelled !== "badge" && cancelled !== "bundle") || !ref) return;
    clearParams();
    toast(t.cancelled);
    void fetch("/api/checkout/cancel", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: cancelled, ref }),
    }).then(() => refreshMine());
  }, [cancelled, ref, t.cancelled, refreshMine]);

  useEffect(() => {
    if (!spot || !spotById.has(spot)) return;
    clearParams();
    document.getElementById("spots")?.scrollIntoView();
    openBid(spot);
  }, [spot, openBid]);

  const close = () => {
    setDismissed(true);
    clearParams();
  };

  const mine = kind === "bid" ? myBids.find((b) => b.id === ref) : undefined;
  const late = mine?.status === "outbid";
  const closedLate = late && state.closed;
  const title = kind === "badge" ? t.badgePaidTitle : closedLate ? t.bidClosedTitle : late ? t.bidLateTitle : t.bidPaidTitle;
  const body = kind === "badge" ? t.badgePaidBody : closedLate ? t.bidClosedBody : late ? t.bidLateBody : t.bidPaidBody;

  return (
    <Sheet open={open} onClose={close} label={title} closeLabel={t.ok}>
      <div className="grid gap-4 p-6 pt-8 text-center sm:p-8">
        <span
          className={`mx-auto grid size-12 place-items-center rounded-full ${late ? "bg-amber-soft text-amber" : "bg-green-soft text-green"}`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 20" className="size-5">
            {late ? (
              <path d="M10 5v6M10 14.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M5 10.5l3.2 3L15 6.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </span>
        <h2 className="text-[22px] font-semibold tracking-tight">{title}</h2>
        <p className="mx-auto max-w-[40ch] text-[15px] leading-relaxed text-ink-2">{body}</p>
        {mine && (
          <p className="font-mono text-[13px] text-ink-2">
            {mine.spotId} · {spotById.get(mine.spotId)?.name[lang]}
          </p>
        )}
        <button
          type="button"
          onClick={close}
          className="mx-auto mt-2 h-11 rounded-full bg-ink px-8 text-[15px] font-medium text-paper hover:opacity-85"
          data-autofocus
        >
          {t.ok}
        </button>
      </div>
    </Sheet>
  );
}
