import { getStore } from "@/lib/store";

const COUNTRY = /^[A-Z]{2}$/;

async function activity(countNow: boolean, request: Request) {
  const store = getStore();
  if (!store) return { views: null, visits: [] };
  const header = request.headers.get("x-vercel-ip-country");
  const country = header && COUNTRY.test(header) ? header : null;
  const views = countNow ? await store.recordView(country) : await store.getViews();
  const visits = await store.recentVisits(6);
  return { views, visits };
}

/** Counts one visit per browser session and returns the totals and latest visits. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { counted?: boolean };
  try {
    return Response.json(await activity(!body.counted, request), { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ views: null, visits: [] });
  }
}

/** Polled by the activity widget; never counts. */
export async function GET(request: Request) {
  try {
    return Response.json(await activity(false, request), { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ views: null, visits: [] });
  }
}
