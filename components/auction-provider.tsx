"use client";

import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { dict } from "@/lib/i18n";
import { spotById, type Side } from "@/lib/spots";
import type { MyBid, PublicState } from "@/lib/types";
import { useMoney } from "./money";

type AuctionContext = {
  state: PublicState;
  refresh: () => Promise<void>;
  myBids: MyBid[];
  refreshMine: () => Promise<void>;
  hereNow: number | null;
  side: Side;
  setSide: (side: Side) => void;
  highlight: string | null;
  setHighlight: (id: string | null) => void;
  bidSpot: string | null;
  openBid: (id: string) => void;
  /** Taken spots show their sponsor first; open spots go straight to the bid form. */
  openSpot: (id: string) => void;
  viewSpot: string | null;
  closeView: () => void;
  closeBid: () => void;
  badgeOpen: boolean;
  setBadgeOpen: (open: boolean) => void;
};

const Ctx = createContext<AuctionContext | null>(null);

function sameState(a: PublicState, b: PublicState) {
  return JSON.stringify({ ...a, updatedAt: "" }) === JSON.stringify({ ...b, updatedAt: "" });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function AuctionProvider({ initial, children }: { initial: PublicState; children: React.ReactNode }) {
  const { lang, money } = useMoney();
  const [state, setState] = useState(initial);
  const [myBids, setMyBids] = useState<MyBid[]>([]);
  const [hereNow, setHereNow] = useState<number | null>(null);
  const [side, setSide] = useState<Side>("front");
  const [highlight, setHighlight] = useState<string | null>(null);
  const [bidSpot, setBidSpot] = useState<string | null>(null);
  const [viewSpot, setViewSpot] = useState<string | null>(null);
  const [badgeOpen, setBadgeOpen] = useState(false);
  const previous = useRef(initial);
  const latest = useRef(initial);
  useEffect(() => {
    latest.current = state;
  }, [state]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) return;
      const next = (await res.json()) as PublicState;
      // Only re-render when something besides the timestamp changed.
      setState((prev) => (sameState(prev, next) ? prev : next));
    } catch {}
  }, []);

  const refreshMine = useCallback(
    () =>
      fetch("/api/bids/mine", { cache: "no-store" })
        .then((res) => (res.ok ? (res.json() as Promise<{ bids: MyBid[] }>) : null))
        .then((data) => {
          if (data) setMyBids((prev) => (JSON.stringify(prev) === JSON.stringify(data.bids) ? prev : data.bids));
        })
        .catch(() => {}),
    [],
  );

  // Announce what changed since the last snapshot.
  useEffect(() => {
    const before = previous.current;
    previous.current = state;
    if (before === state) return;
    const t = dict(lang).live;
    const known = new Set(before.recent.map((b) => b.id));
    const fresh = state.recent.filter((b) => !known.has(b.id)).slice(0, 3);
    for (const bid of fresh) {
      const spot = spotById.get(bid.spotId);
      toast(t.newBid(money(bid.amount), spot ? `${spot.id} · ${spot.name[lang]}` : bid.spotId));
    }
    if (state.badge.holder && state.badge.holder.id !== before.badge.holder?.id) {
      toast(t.newBadge(money(state.badge.holder.amount)));
    }
  }, [state, lang, money]);

  // Realtime when Supabase is connected, polling as a safety net either way.
  useEffect(() => {
    const realtime = Boolean(SUPABASE_URL && SUPABASE_KEY);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = setInterval(onVisible, realtime ? 45_000 : 15_000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const firstLoad = setTimeout(() => void refreshMine(), 0);

    let channels: RealtimeChannel[] = [];
    let cleanupClient: (() => void) | undefined;
    if (realtime) {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!, { auth: { persistSession: false } });
      const auction = supabase
        .channel("auction")
        .on("broadcast", { event: "changed" }, () => {
          void refresh();
          void refreshMine();
        })
        .subscribe();
      const lobby = supabase.channel("lobby", { config: { presence: { key: crypto.randomUUID() } } });
      lobby
        .on("presence", { event: "sync" }, () => setHereNow(Object.keys(lobby.presenceState()).length))
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") await lobby.track({ at: Date.now() });
        });
      channels = [auction, lobby];
      cleanupClient = () => {
        for (const channel of channels) void supabase.removeChannel(channel);
      };
    }

    return () => {
      clearTimeout(firstLoad);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      cleanupClient?.();
    };
  }, [refresh, refreshMine]);

  const closeBid = useCallback(() => setBidSpot(null), []);

  const openBid = useCallback((id: string) => {
    const spot = spotById.get(id);
    if (spot) setSide(spot.side);
    setViewSpot(null);
    setBidSpot(id);
  }, []);

  const closeView = useCallback(() => setViewSpot(null), []);

  const openSpot = useCallback(
    (id: string) => {
      const spot = spotById.get(id);
      if (spot) setSide(spot.side);
      if (latest.current.spots[id]?.leader) setViewSpot(id);
      else openBid(id);
    },
    [openBid],
  );

  const value = useMemo<AuctionContext>(
    () => ({
      state,
      refresh,
      myBids,
      refreshMine,
      hereNow,
      side,
      setSide,
      highlight,
      setHighlight,
      bidSpot,
      openBid,
      openSpot,
      viewSpot,
      closeView,
      closeBid,
      badgeOpen,
      setBadgeOpen,
    }),
    [state, refresh, myBids, refreshMine, hereNow, side, highlight, bidSpot, openBid, openSpot, viewSpot, closeView, closeBid, badgeOpen],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuction() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuction must be used inside AuctionProvider");
  return ctx;
}
