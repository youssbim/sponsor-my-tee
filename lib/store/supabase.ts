import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BadgeRow, BidRow, ConfirmBadgeResult, ConfirmBidResult } from "../types";
import { site } from "../config";
import type { Store } from "./types";

const LOGO_BUCKET = "logos";

let client: SupabaseClient | null = null;

function db() {
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

function must<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export const supabaseStore: Store = {
  async listBids() {
    return must(await db().from("bids").select("*").neq("status", "pending").neq("status", "expired"));
  },
  async listBidsByBundle(bundleId) {
    return must(await db().from("bids").select("*").eq("bundle_id", bundleId));
  },
  async listBidsForSpot(spotId) {
    return must(await db().from("bids").select("*").eq("spot_id", spotId));
  },
  async listBidsByBidder(bidderId) {
    return must(
      await db().from("bids").select("*").eq("bidder_id", bidderId).order("created_at", { ascending: false }),
    );
  },
  async getBid(id) {
    return must(await db().from("bids").select("*").eq("id", id).maybeSingle());
  },
  async createBid(input) {
    return must(await db().from("bids").insert(input).select("*").single()) as BidRow;
  },
  async updateBid(id, patch) {
    must(await db().from("bids").update(patch).eq("id", id));
  },
  async confirmBid(id, paymentIntent, increment) {
    return must(
      await db().rpc("confirm_bid", {
        p_bid: id,
        p_payment_intent: paymentIntent,
        p_increment: increment,
        p_rate: site.auction.raiseRate,
        p_round: site.auction.roundTo,
      }),
    ) as ConfirmBidResult;
  },
  async countBidsSince(bidderId, sinceIso) {
    const { count, error } = await db()
      .from("bids")
      .select("id", { count: "exact", head: true })
      .eq("bidder_id", bidderId)
      .gte("created_at", sinceIso);
    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  async listBadgeClaims() {
    return must(await db().from("badge_claims").select("*").neq("status", "pending"));
  },
  async listBadgeClaimsByBidder(bidderId) {
    return must(
      await db().from("badge_claims").select("*").eq("bidder_id", bidderId).order("created_at", { ascending: false }),
    );
  },
  async getBadgeClaim(id) {
    return must(await db().from("badge_claims").select("*").eq("id", id).maybeSingle());
  },
  async createBadgeClaim(input) {
    return must(await db().from("badge_claims").insert(input).select("*").single()) as BadgeRow;
  },
  async updateBadgeClaim(id, patch) {
    must(await db().from("badge_claims").update(patch).eq("id", id));
  },
  async confirmBadgeClaim(id, paymentIntent, start, step) {
    return must(
      await db().rpc("confirm_badge_claim", {
        p_claim: id,
        p_payment_intent: paymentIntent,
        p_start: start,
        p_step: step,
      }),
    ) as ConfirmBadgeResult;
  },

  async uploadLogo(file, key) {
    const path = `bids/${key}`;
    must(
      await db()
        .storage.from(LOGO_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false, cacheControl: "31536000" }),
    );
    return path;
  },
  logoUrl(path) {
    return db().storage.from(LOGO_BUCKET).getPublicUrl(path).data.publicUrl;
  },

  async getGoal() {
    const row = must(await db().from("site_stats").select("goal").eq("id", 1).maybeSingle()) as { goal: number } | null;
    return Number(row?.goal ?? site.auction.goal);
  },
  async setGoal(goal) {
    must(await db().from("site_stats").update({ goal }).eq("id", 1));
  },
  async recordView(country) {
    return Number(must(await db().rpc("record_view", { p_country: country })));
  },
  async getViews() {
    const row = must(await db().from("site_stats").select("views").eq("id", 1).maybeSingle()) as { views: number } | null;
    return Number(row?.views ?? 0);
  },
  async recentVisits(limit) {
    const rows = must(
      await db().from("visits").select("country, created_at").order("created_at", { ascending: false }).limit(limit),
    ) as { country: string | null; created_at: string }[];
    return rows.map((r) => ({ country: r.country, at: r.created_at }));
  },
};
