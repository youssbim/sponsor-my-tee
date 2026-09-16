import { LegalPage, privacy } from "@/components/legal-page";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("it", "/privacy", privacy.it.title);

export default function Page() {
  return <LegalPage lang="it" doc={privacy.it} />;
}
