import { RootShell } from "@/components/root-shell";
import { pageMetadata } from "@/lib/metadata";

export { viewport } from "@/lib/metadata";
export const metadata = pageMetadata("en");

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <RootShell lang="en">{children}</RootShell>;
}
