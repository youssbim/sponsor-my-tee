import { getPublicState } from "@/lib/store";

export async function GET() {
  const state = await getPublicState();
  return Response.json(state, { headers: { "cache-control": "no-store" } });
}
