import { RootShell } from "@/components/root-shell";
import { pageMetadata } from "@/lib/metadata";

export { viewport } from "@/lib/metadata";
export const metadata = pageMetadata("it");

export default function ItalianLayout({ children }: { children: React.ReactNode }) {
  return <RootShell lang="it">{children}</RootShell>;
}
