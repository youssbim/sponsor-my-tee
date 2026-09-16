import { LegalPage, privacy } from "@/components/legal-page";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("en", "/privacy", privacy.en.title);

export default function Page() {
  return <LegalPage lang="en" doc={privacy.en} />;
}
