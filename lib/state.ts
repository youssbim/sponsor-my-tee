import { isClosed, nextMinimum, site } from "./config";
import { isSpotOpen, spots } from "./spots";
import type { BadgeHolder, BadgeRow, BidRow, PublicBid, PublicState, SpotState, TopBuyer } from "./types";

type LogoUrl = (path: string) => string;

function toPublicBid(row: BidRow, logoUrl: LogoUrl): PublicBid {
  const approved = row.approved_at !== null;
  return {
    id: row.id,
    spotId: row.spot_id,
    amount: row.amount,
    at: row.confirmed_at ?? row.created_at,
    standing: row.status === "active",
    brand: approved ? row.brand : null,
    logoUrl: approved ? logoUrl(row.logo_path) : null,
    url: approved ? row.url : null,
    xHandle: approved ? row.x_handle : null,
    logoIncludesName: row.logo_includes_name,
    logoScale: row.logo_scale ?? 100,
    logoOffsetX: row.logo_offset_x ?? 0,
    logoOffsetY: row.logo_offset_y ?? 0,
  };
}

/** Bids that were paid for at some point — the ones that count in public. */
export function isPaidBid(row: BidRow) {
  return row.status === "active" || row.status === "outbid";
}

export function buildPublicState(
  bids: BidRow[],
  claims: BadgeRow[],
  opts: { enabled: boolean; logoUrl: LogoUrl; now?: number; goal?: number },
): PublicState {
  const now = opts.now ?? Date.now();
  const paid = bids
    .filter(isPaidBid)
    .sort((a, b) => Date.parse(b.confirmed_at ?? b.created_at) - Date.parse(a.confirmed_at ?? a.created_at));

  const spotStates: Record<string, SpotState> = {};
  let raised = 0;
  let taken = 0;

  for (const spot of spots) {
    const forSpot = paid.filter((b) => b.spot_id === spot.id);
    const leaderRow = forSpot.find((b) => b.status === "active") ?? null;
    if (leaderRow) {
      raised += leaderRow.amount;
      taken += 1;
    }
    spotStates[spot.id] = {
      id: spot.id,
      leader: leaderRow ? toPublicBid(leaderRow, opts.logoUrl) : null,
      bidCount: forSpot.length,
      nextMin: leaderRow ? nextMinimum(leaderRow.amount) : spot.min,
      open: isSpotOpen(spot, now),
    };
  }

  const history = badgeHistory(claims);
  const current = history[0] ?? null;
  raised += claims.filter((c) => c.status === "held").reduce((sum, c) => sum + c.amount, 0);

  return {
    enabled: opts.enabled,
    closed: isClosed(now),
    spots: spotStates,
    totals: { raised, bids: paid.length, taken, spots: spots.length, goal: opts.goal ?? site.auction.goal },
    recent: paid.slice(0, 200).map((b) => toPublicBid(b, opts.logoUrl)),
    badge: {
      holder: current,
      nextMin: current ? current.amount + site.badge.step : site.badge.start,
      history,
    },
    topBuyer: topBuyer(spotStates),
    updatedAt: new Date(now).toISOString(),
  };
}

/** Groups the approved leaders by brand and returns the one with the highest total. */
export function topBuyer(spotStates: Record<string, SpotState>): TopBuyer | null {
  const groups = new Map<string, TopBuyer & { firstAt: number }>();
  for (const spot of spots) {
    const s = spotStates[spot.id];
    const leader = s?.leader;
    if (!leader?.brand) continue;
    const key = leader.brand.trim().toLowerCase();
    const group =
      groups.get(key) ??
      ({ brand: leader.brand, logoUrl: leader.logoUrl, url: leader.url, xHandle: leader.xHandle, total: 0, takeoverTotal: 0, spots: [], firstAt: Date.parse(leader.at) } as TopBuyer & { firstAt: number });
    group.total += leader.amount;
    group.takeoverTotal += s.nextMin;
    group.spots.push({ spotId: spot.id, amount: leader.amount, nextMin: s.nextMin });
    group.firstAt = Math.min(group.firstAt, Date.parse(leader.at));
    group.url ??= leader.url;
    group.xHandle ??= leader.xHandle;
    groups.set(key, group);
  }
  // Highest total wins; on a tie, whoever got there first.
  const best = [...groups.values()].sort((a, b) => b.total - a.total || a.firstAt - b.firstAt)[0];
  if (!best) return null;
  return { brand: best.brand, logoUrl: best.logoUrl, url: best.url, xHandle: best.xHandle, total: best.total, takeoverTotal: best.takeoverTotal, spots: best.spots };
}

/** Newest holder first. Hidden holders keep their place in the price ladder. */
function badgeHistory(claims: BadgeRow[]): BadgeHolder[] {
  const held = claims
    .filter((c) => c.status === "held" && c.paid_at)
    .sort((a, b) => Date.parse(b.paid_at!) - Date.parse(a.paid_at!));

  return held.map((c, i) => ({
    id: c.id,
    label: c.hidden ? "—" : c.label,
    url: c.hidden ? null : c.url,
    xHandle: c.hidden ? null : c.x_handle,
    amount: c.amount,
    since: c.paid_at!,
    until: i === 0 ? null : held[i - 1].paid_at,
  }));
}

export function emptyState(enabled: boolean): PublicState {
  return buildPublicState([], [], { enabled, logoUrl: () => "" });
}
