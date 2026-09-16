import { NextResponse, type NextRequest } from "next/server";

// Italian visitors get /it, everyone else the English pages, unless they picked a language by hand.
export const LANG_COOKIE = "otb.lang";
export const COUNTRY_COOKIE = "otb.country";

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|lighthouse|vercel-screenshot/i;
const YEAR = 60 * 60 * 24 * 365;

export function proxy(request: NextRequest) {
  const { search, searchParams } = request.nextUrl;
  // The root page can reach the proxy as /index; treat it as the path people actually see.
  const pathname = request.nextUrl.pathname.replace(/\/index$/, "") || "/";
  const country = request.headers.get("x-vercel-ip-country");
  const withCountry = (res: NextResponse) => {
    if (country && request.cookies.get(COUNTRY_COOKIE)?.value !== country) {
      res.cookies.set(COUNTRY_COOKIE, country, { path: "/", maxAge: YEAR, sameSite: "lax" });
    }
    return res;
  };

  const chosen = request.cookies.get(LANG_COOKIE)?.value;
  // Checkout returns and deep links already carry the right language.
  const returning = searchParams.has("paid") || searchParams.has("cancelled") || searchParams.has("spot");
  if (!country || chosen || returning || BOT.test(request.headers.get("user-agent") ?? "")) {
    return withCountry(NextResponse.next());
  }

  const onItalian = pathname === "/it" || pathname.startsWith("/it/");
  const wantItalian = country === "IT";
  if (wantItalian === onItalian) return withCountry(NextResponse.next());

  const target = request.nextUrl.clone();
  target.pathname = wantItalian ? (pathname === "/" ? "/it" : `/it${pathname}`) : pathname.replace(/^\/it/, "") || "/";
  target.search = search;
  return withCountry(NextResponse.redirect(target, 307));
}

export const config = {
  matcher: ["/", "/leaderboard", "/terms", "/privacy", "/it", "/it/:path*"],
};
