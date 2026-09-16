import { LegalPage, terms } from "@/components/legal-page";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("en", "/terms", terms.en.title);

export default function Page() {
  return <LegalPage lang="en" doc={terms.en} />;
}
