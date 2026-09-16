import "server-only";

export const isDev = process.env.NODE_ENV === "development";

export const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY,
);

export const hasStripe = Boolean(
  process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET,
);

/** Local JSON store instead of Supabase — development only. */
export const useDevStore = isDev && !hasSupabase;

/** Fake checkout page instead of Stripe — development only. */
export const useMockPayments = isDev && !hasStripe;

/** In production bidding stays closed until Supabase and Stripe are both connected. */
export const biddingEnabled = (hasSupabase || useDevStore) && (hasStripe || useMockPayments);
