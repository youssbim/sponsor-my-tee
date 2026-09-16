import type { Lang } from "./spots";

export type BidStatus = "pending" | "active" | "outbid" | "rejected" | "expired";
export type BadgeStatus = "pending" | "held" | "late" | "expired";

export type BidRow = {
  id: string;
  spot_id: string;
  amount: number;
  deposit: number;
  brand: string;
  url: string | null;
  x_handle: string | null;
  email: string;
  logo_path: string;
  logo_includes_name: boolean;
  /** Percent of the fitted size the logo is drawn at. */
  logo_scale: number;
  /** Shift inside the spot, in percent of its width and height. */
  logo_offset_x: number;
  logo_offset_y: number;
  /** Set when this bid was paid together with others in a single checkout. */
  bundle_id: string | null;
  lang: Lang;
  bidder_id: string;
  status: BidStatus;
  approved_at: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  refunded_at: string | null;
  refund_id: string | null;
  balance_session_id: string | null;
  balance_paid_at: string | null;
  created_at: string;
  confirmed_at: string | null;
  outbid_at: string | null;
  rejected_at: string | null;
};

export type BadgeRow = {
  id: string;
  label: string;
  url: string | null;
  x_handle: string | null;
  email: string;
  amount: number;
  lang: Lang;
  bidder_id: string;
  status: BadgeStatus;
  hidden: boolean;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  refunded_at: string | null;
  refund_id: string | null;
  created_at: string;
  paid_at: string | null;
};

export type NewBid = Pick<
  BidRow,
  | "spot_id"
  | "amount"
  | "deposit"
  | "brand"
  | "url"
  | "x_handle"
  | "email"
  | "logo_path"
  | "logo_includes_name"
  | "lang"
  | "bidder_id"
> & { bundle_id?: string | null };

export type NewBadgeClaim = Pick<
  BadgeRow,
  "label" | "url" | "x_handle" | "email" | "amount" | "lang" | "bidder_id"
>;

export type ConfirmBidResult =
  | { outcome: "leading"; displaced: string | null }
  | { outcome: "late" }
  | { outcome: "noop" }
  | { outcome: "missing" };

export type ConfirmBadgeResult =
  | { outcome: "held"; previous: string | null }
  | { outcome: "late" }
  | { outcome: "noop" }
  | { outcome: "missing" };

// ---- What the browser gets -------------------------------------------------

export type PublicBid = {
  id: string;
  spotId: string;
  amount: number;
  at: string;
  standing: boolean;
  /** Null until I approve the brand. */
  brand: string | null;
  logoUrl: string | null;
  url: string | null;
  xHandle: string | null;
  logoIncludesName: boolean;
  logoScale: number;
  logoOffsetX: number;
  logoOffsetY: number;
};

export type SpotState = {
  id: string;
  leader: PublicBid | null;
  bidCount: number;
  nextMin: number;
  open: boolean;
};

export type BadgeHolder = {
  id: string;
  label: string;
  url: string | null;
  xHandle: string | null;
  amount: number;
  since: string;
  until: string | null;
};

export type PublicState = {
  enabled: boolean;
  closed: boolean;
  spots: Record<string, SpotState>;
  totals: { raised: number; bids: number; taken: number; spots: number; goal: number };
  recent: PublicBid[];
  badge: { holder: BadgeHolder | null; nextMin: number; history: BadgeHolder[] };
  /** The brand that has spent the most across the spots it currently leads. */
  topBuyer: TopBuyer | null;
  updatedAt: string;
};

export type TopBuyer = {
  brand: string;
  logoUrl: string | null;
  url: string | null;
  xHandle: string | null;
  total: number;
  /** What it takes to beat them everywhere: the sum of every spot's next minimum. */
  takeoverTotal: number;
  spots: { spotId: string; amount: number; nextMin: number }[];
};

export type MyBid = {
  id: string;
  spotId: string;
  amount: number;
  brand: string;
  status: BidStatus;
  approved: boolean;
  createdAt: string;
};
