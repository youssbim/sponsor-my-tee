// Everything a human might want to tweak before launch lives here.
// Amounts are whole euros; dates are ISO strings in Europe/Rome time.

export const site = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  name: "Sponsor My Tee",
  timeZone: "Europe/Rome",
  owner: {
    name: "Your Name",
    firstName: "You",
    portfolio: "https://example.com",
    linkedin: "https://linkedin.com/in/your-handle",
    github: "https://github.com/your-handle",
    x: "https://x.com/your-handle",
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "you@example.com",
  },
  event: {
    name: "Your Conference",
    edition: "Your Conference 2026",
    venue: "The Venue",
    city: "Your City",
    startsAt: "2026-10-07T09:00:00+02:00",
    endsAt: "2026-10-09T18:00:00+02:00",
  },
  auction: {
    closesAt: "2026-10-01T20:00:00+02:00",
    // An outbid must beat the leader by raiseRate and by minIncrement euros, rounded up to roundTo.
    minIncrement: 10,
    raiseRate: 0.3,
    roundTo: 5,
    goal: 1500,
  },
  badge: {
    start: 5,
    step: 1,
  },
  // What the goal pays for. Keep the sum equal to auction.goal.
  budget: [
    { key: "travel", amount: 700 },
    { key: "stay", amount: 500 },
    { key: "prints", amount: 150 },
    { key: "food", amount: 150 },
  ],
  tee: {
    size: "L",
    fabric: "100% cotton, 220 g/m²",
    printMethod: "DTF",
  },
} as const;

export type BudgetKey = (typeof site.budget)[number]["key"];

/** The least you can bid to take a spot from someone who holds it at `amount`. Mirrors confirm_bid in SQL. */
export function nextMinimum(amount: number) {
  const { minIncrement, raiseRate, roundTo } = site.auction;
  return Math.ceil(Math.max(amount + minIncrement, amount * (1 + raiseRate)) / roundTo) * roundTo;
}

export function isClosed(now = Date.now()) {
  return now >= Date.parse(site.auction.closesAt);
}
