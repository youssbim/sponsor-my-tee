// Published figures about your event, with where they come from. Replace them before going live.

export const eventStats = {
  /** Turnout of the previous edition, used for the "per 1,000 attendees" figure. */
  attendeesLastEdition: 15000,
  numbers: [
    { key: "attendees", value: 15000, plus: true },
    { key: "investors", value: 1500, plus: true },
    { key: "startups", value: 1500, plus: true },
    { key: "speakers", value: 200, plus: true },
    { key: "sideEvents", value: 90, plus: true },
    { key: "meetings", value: 4500, plus: false },
  ],
  speakers: [
    { name: "Speaker One", role: { en: "CEO, Example Corp", it: "CEO, Example Corp" } },
    { name: "Speaker Two", role: { en: "Founder, Example Labs", it: "Fondatrice, Example Labs" } },
    { name: "Speaker Three", role: { en: "Partner, Example Ventures", it: "Partner, Example Ventures" } },
  ],
  /** LinkedIn Ads B2B median CPM, US dollars. */
  linkedinCpm: { low: 31, high: 38 },
  sources: [
    { label: "yourconference.com", url: "https://example.com" },
    { label: "Attendance report", url: "https://example.com" },
    { label: "LinkedIn Ads benchmarks 2025", url: "https://blog.closelyhq.com/linkedin-ad-benchmarks-cpc-cpm-and-ctr-by-industry/" },
  ],
} as const;

export type StatKey = (typeof eventStats.numbers)[number]["key"];

/** Price of a spot per 1,000 people who attended the last edition. */
export function perThousandAttendees(price: number) {
  return price / (eventStats.attendeesLastEdition / 1000);
}
