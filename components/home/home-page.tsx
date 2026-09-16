import { getPublicState } from "@/lib/store";
import type { Lang } from "@/lib/spots";
import { AuctionProvider } from "../auction-provider";
import { SiteFooter } from "../site-footer";
import { FeaturedSpot, LogoWall, SpotTables } from "./auction-sections";
import { BidDialog } from "./bid-dialog";
import { SponsorDialog } from "./sponsor-dialog";
import { HomeHeader } from "./home-header";
import { Hero } from "./hero";
import { About, EventCard, Faq, HowItWorks, Perks, SloganBand } from "./info-sections";
import { ActivityFeed, SponsorsFab } from "./floating-ui";
import { MyBids } from "./my-bids";
import { ReturnHandler } from "./return-handler";

export async function HomePage({ lang }: { lang: Lang }) {
  const state = await getPublicState();
  return (
    <AuctionProvider initial={state}>
      <HomeHeader />
      <main>
        <Hero />
        <SloganBand lang={lang} />
        <SpotTables />
        <FeaturedSpot />
        <LogoWall />
        <HowItWorks lang={lang} />
        <EventCard lang={lang} />
        <Perks lang={lang} />
        <About lang={lang} />
        <Faq lang={lang} />
      </main>
      <SiteFooter lang={lang} />
      <SponsorDialog />
      <BidDialog />
      <ReturnHandler />
      <MyBids />
      <SponsorsFab />
      <ActivityFeed />
    </AuctionProvider>
  );
}
