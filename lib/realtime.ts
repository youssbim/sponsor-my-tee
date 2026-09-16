import "server-only";
import { revalidatePath } from "next/cache";
import { hasSupabase } from "./env";

export const AUCTION_CHANNEL = "auction";

export type AuctionEvent =
  | { type: "bid"; spotId: string; amount: number }
  | { type: "badge"; amount: number }
  | { type: "review" };

/** Tells every open page to refetch, and refreshes the cached pages. */
export async function announce(event: AuctionEvent) {
  for (const path of ["/", "/it", "/leaderboard", "/it/leaderboard"]) {
    revalidatePath(path);
  }
  if (!hasSupabase) return;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: process.env.SUPABASE_SECRET_KEY!,
      },
      body: JSON.stringify({
        messages: [{ topic: AUCTION_CHANNEL, event: "changed", payload: event, private: false }],
      }),
    });
    if (!res.ok) console.error("[realtime] broadcast failed", res.status, await res.text());
  } catch (error) {
    console.error("[realtime] broadcast failed", error);
  }
}
