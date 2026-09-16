import { getPublicState } from "@/lib/store";
import type { Lang } from "@/lib/spots";
import { AuctionProvider } from "../auction-provider";
import { SiteFooter } from "../site-footer";
import { SiteHeader } from "../site-header";
import { LeaderboardView } from "./leaderboard-view";

export async function LeaderboardPage({ lang }: { lang: Lang }) {
  const state = await getPublicState();
  return (
    <AuctionProvider initial={state}>
      <SiteHeader />
      <LeaderboardView />
      <SiteFooter lang={lang} />
    </AuctionProvider>
  );
}
