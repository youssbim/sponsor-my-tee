import { HomePage } from "@/components/home/home-page";

export const revalidate = 60;

export default function Page() {
  return <HomePage lang="it" />;
}
