import { readBidderId } from "@/lib/bidder";
import { getStore } from "@/lib/store";
import type { MyBid } from "@/lib/types";

export async function GET() {
  const bidderId = await readBidderId();
  const store = getStore();
  if (!bidderId || !store) return Response.json({ bids: [] }, { headers: { "cache-control": "no-store" } });

  const rows = await store.listBidsByBidder(bidderId);
  const bids: MyBid[] = rows
    .filter((b) => b.status !== "expired")
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .map((b) => ({
      id: b.id,
      spotId: b.spot_id,
      amount: b.amount,
      brand: b.brand,
      status: b.status,
      approved: b.approved_at !== null,
      createdAt: b.created_at,
    }));

  return Response.json({ bids }, { headers: { "cache-control": "no-store" } });
}
