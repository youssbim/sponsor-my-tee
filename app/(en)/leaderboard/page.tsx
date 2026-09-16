import { LeaderboardPage } from "@/components/leaderboard/leaderboard-page";
import { dict } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

export const revalidate = 60;
export const metadata = pageMetadata("en", "/leaderboard", dict("en").leaderboard.title);

export default function Page() {
  return <LeaderboardPage lang="en" />;
}
