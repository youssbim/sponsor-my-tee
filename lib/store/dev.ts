import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { BadgeRow, BidRow, NewBadgeClaim, NewBid } from "../types";
import { nextMinimum, site } from "../config";
import type { Store } from "./types";

// A JSON file on disk. Good enough for one developer, never used in production.

const dir = path.join(process.cwd(), ".data");
const dbFile = path.join(dir, "dev-store.json");
export const devLogoDir = path.join(dir, "logos");

type Db = { bids: BidRow[]; badge: BadgeRow[]; views: number; goal?: number; visits?: { country: string | null; at: string }[] };

let queue: Promise<unknown> = Promise.resolve();

function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function load(): Promise<Db> {
  try {
    return JSON.parse(await readFile(dbFile, "utf8")) as Db;
  } catch {
    return { bids: [], badge: [], views: 0 };
  }
}

async function save(db: Db) {
  await mkdir(dir, { recursive: true });
  await writeFile(dbFile, JSON.stringify(db, null, 2));
}

function mutate<T>(fn: (db: Db) => T): Promise<T> {
  return serialized(async () => {
    const db = await load();
    const result = fn(db);
    await save(db);
    return result;
  });
}

const now = () => new Date().toISOString();

export const devStore: Store = {
  async listBids() {
    return (await load()).bids;
  },
  async listBidsByBundle(bundleId) {
    return (await load()).bids.filter((b) => b.bundle_id === bundleId);
  },
  async listBidsForSpot(spotId) {
    return (await load()).bids.filter((b) => b.spot_id === spotId);
  },
  async listBidsByBidder(bidderId) {
    return (await load()).bids.filter((b) => b.bidder_id === bidderId);
  },
  async getBid(id) {
    return (await load()).bids.find((b) => b.id === id) ?? null;
  },
  createBid(input: NewBid) {
    return mutate((db) => {
      const row: BidRow = {
        ...input,
        id: randomUUID(),
        status: "pending",
        logo_scale: 100,
        logo_offset_x: 0,
        logo_offset_y: 0,
        bundle_id: input.bundle_id ?? null,
        approved_at: null,
        stripe_session_id: null,
        stripe_payment_intent: null,
        refunded_at: null,
        refund_id: null,
        balance_session_id: null,
        balance_paid_at: null,
        created_at: now(),
        confirmed_at: null,
        outbid_at: null,
        rejected_at: null,
      };
      db.bids.push(row);
      return row;
    });
  },
  updateBid(id, patch) {
    return mutate((db) => {
      const row = db.bids.find((b) => b.id === id);
      if (row) Object.assign(row, patch);
    });
  },
  confirmBid(id, paymentIntent, increment) {
    return mutate((db) => {
      const bid = db.bids.find((b) => b.id === id);
      if (!bid) return { outcome: "missing" as const };
      if (bid.status !== "pending") return { outcome: "noop" as const };

      const leader = db.bids.find((b) => b.spot_id === bid.spot_id && b.status === "active");
      const at = now();
      bid.stripe_payment_intent = paymentIntent;
      bid.confirmed_at = at;

      const required = leader ? Math.max(nextMinimum(leader.amount), leader.amount + increment) : 0;
      if (leader && bid.amount < required) {
        bid.status = "outbid";
        bid.outbid_at = at;
        return { outcome: "late" as const };
      }
      if (leader) {
        leader.status = "outbid";
        leader.outbid_at = at;
      }
      bid.status = "active";
      return { outcome: "leading" as const, displaced: leader?.id ?? null };
    });
  },
  async countBidsSince(bidderId, sinceIso) {
    const since = Date.parse(sinceIso);
    return (await load()).bids.filter(
      (b) => b.bidder_id === bidderId && Date.parse(b.created_at) >= since,
    ).length;
  },

  async listBadgeClaims() {
    return (await load()).badge;
  },
  async listBadgeClaimsByBidder(bidderId) {
    return (await load()).badge.filter((c) => c.bidder_id === bidderId);
  },
  async getBadgeClaim(id) {
    return (await load()).badge.find((c) => c.id === id) ?? null;
  },
  createBadgeClaim(input: NewBadgeClaim) {
    return mutate((db) => {
      const row: BadgeRow = {
        ...input,
        id: randomUUID(),
        status: "pending",
        hidden: false,
        stripe_session_id: null,
        stripe_payment_intent: null,
        refunded_at: null,
        refund_id: null,
        created_at: now(),
        paid_at: null,
      };
      db.badge.push(row);
      return row;
    });
  },
  updateBadgeClaim(id, patch) {
    return mutate((db) => {
      const row = db.badge.find((c) => c.id === id);
      if (row) Object.assign(row, patch);
    });
  },
  confirmBadgeClaim(id, paymentIntent, start, step) {
    return mutate((db) => {
      const claim = db.badge.find((c) => c.id === id);
      if (!claim) return { outcome: "missing" as const };
      if (claim.status !== "pending") return { outcome: "noop" as const };

      const holder = db.badge
        .filter((c) => c.status === "held" && c.paid_at)
        .sort((a, b) => Date.parse(b.paid_at!) - Date.parse(a.paid_at!))[0];
      const min = holder ? holder.amount + step : start;

      claim.stripe_payment_intent = paymentIntent;
      claim.paid_at = now();
      if (claim.amount < min) {
        claim.status = "late";
        return { outcome: "late" as const };
      }
      claim.status = "held";
      return { outcome: "held" as const, previous: holder?.id ?? null };
    });
  },

  async uploadLogo(file, key) {
    await mkdir(devLogoDir, { recursive: true });
    await writeFile(path.join(devLogoDir, key), Buffer.from(await file.arrayBuffer()));
    return key;
  },
  logoUrl(p) {
    return `/api/dev/logo/${encodeURIComponent(p)}`;
  },

  async getGoal() {
    return (await load()).goal ?? site.auction.goal;
  },
  setGoal(goal) {
    return mutate((db) => {
      db.goal = goal;
    });
  },
  recordView(country) {
    return mutate((db) => {
      db.views += 1;
      if (country) db.visits = [{ country, at: new Date().toISOString() }, ...(db.visits ?? [])].slice(0, 50);
      return db.views;
    });
  },
  async recentVisits(limit) {
    return ((await load()).visits ?? []).slice(0, limit);
  },
  async getViews() {
    return (await load()).views;
  },
};
