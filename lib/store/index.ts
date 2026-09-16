import "server-only";
import { biddingEnabled, hasSupabase, useDevStore } from "../env";
import { buildPublicState, emptyState } from "../state";
import type { PublicState } from "../types";
import { devStore } from "./dev";
import { supabaseStore } from "./supabase";
import type { Store } from "./types";

export function getStore(): Store | null {
  if (hasSupabase) return supabaseStore;
  if (useDevStore) return devStore;
  return null;
}

export async function getPublicState(): Promise<PublicState> {
  const store = getStore();
  if (!store) return emptyState(false);
  try {
    const [bids, claims, goal] = await Promise.all([store.listBids(), store.listBadgeClaims(), store.getGoal()]);
    return buildPublicState(bids, claims, { enabled: biddingEnabled, logoUrl: store.logoUrl, goal });
  } catch (error) {
    console.error("[state] could not load auction state", error);
    return emptyState(false);
  }
}
