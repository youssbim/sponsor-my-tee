import { ogAlt, ogSize, renderOg } from "@/lib/og";

export const alt = ogAlt;
export const size = ogSize;
export const contentType = "image/png";
export const revalidate = 300;

export default function Image() {
  return renderOg("en");
}
