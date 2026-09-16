import type {
  BadgeRow,
  BidRow,
  ConfirmBadgeResult,
  ConfirmBidResult,
  NewBadgeClaim,
  NewBid,
} from "../types";

export interface Store {
  listBids(): Promise<BidRow[]>;
  listBidsForSpot(spotId: string): Promise<BidRow[]>;
  listBidsByBundle(bundleId: string): Promise<BidRow[]>;
  listBidsByBidder(bidderId: string): Promise<BidRow[]>;
  getBid(id: string): Promise<BidRow | null>;
  createBid(input: NewBid): Promise<BidRow>;
  updateBid(id: string, patch: Partial<BidRow>): Promise<void>;
  /** Atomically turns a pending bid into the leader, or marks it late. */
  /** `increment` is the least a new bid must add in euros; the 20% rule and rounding come from the config. */
  confirmBid(id: string, paymentIntent: string, increment: number): Promise<ConfirmBidResult>;
  countBidsSince(bidderId: string, sinceIso: string): Promise<number>;

  listBadgeClaims(): Promise<BadgeRow[]>;
  listBadgeClaimsByBidder(bidderId: string): Promise<BadgeRow[]>;
  getBadgeClaim(id: string): Promise<BadgeRow | null>;
  createBadgeClaim(input: NewBadgeClaim): Promise<BadgeRow>;
  updateBadgeClaim(id: string, patch: Partial<BadgeRow>): Promise<void>;
  confirmBadgeClaim(id: string, paymentIntent: string, start: number, step: number): Promise<ConfirmBadgeResult>;

  uploadLogo(file: File, key: string): Promise<string>;
  logoUrl(path: string): string;

  /** The fundraising goal in euros, editable from the admin. */
  getGoal(): Promise<number>;
  setGoal(goal: number): Promise<void>;
  recordView(country: string | null): Promise<number>;
  getViews(): Promise<number>;
  recentVisits(limit: number): Promise<Visit[]>;
}

export type Visit = { country: string | null; at: string };
