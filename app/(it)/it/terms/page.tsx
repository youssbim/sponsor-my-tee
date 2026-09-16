import { LegalPage, terms } from "@/components/legal-page";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("it", "/terms", terms.it.title);

export default function Page() {
  return <LegalPage lang="it" doc={terms.it} />;
}
