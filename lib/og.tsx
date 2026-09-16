import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { site } from "./config";
import { formatMoney } from "./format";
import { dict } from "./i18n";
import { spots, type Lang } from "./spots";
import { getPublicState } from "./store";
import { teePhotos } from "./tee-photo";

export const ogSize = { width: 1200, height: 630 };

/** The front photo as a data URI: from disk at build time, from the live site afterwards. */
async function photoDataUri() {
  const toUri = (bytes: ArrayBuffer | Buffer) => `data:image/jpeg;base64,${Buffer.from(bytes as ArrayBuffer).toString("base64")}`;
  try {
    return toUri(await readFile(path.join(process.cwd(), "public", teePhotos.front.src)));
  } catch {
    try {
      const res = await fetch(`${site.url}${teePhotos.front.src}`);
      if (res.ok) return toUri(await res.arrayBuffer());
    } catch {}
  }
  return null;
}

export async function renderOg(lang: Lang) {
  const t = dict(lang);
  const [state, photo] = await Promise.all([getPublicState(), photoDataUri()]);
  const cheapest = Math.min(...spots.map((s) => state.spots[s.id]?.nextMin ?? s.min));

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#ffffff", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 0 64px 72px", width: 680 }}>
          <div style={{ display: "flex", fontSize: 24, color: "#6e6e73" }}>{t.hero.kicker}</div>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2, color: "#1d1d1f" }}>
            {t.hero.title}
          </div>
          <div style={{ display: "flex", gap: 28, fontSize: 26, color: "#1d1d1f" }}>
            <span style={{ fontWeight: 700 }}>
              {state.totals.taken}/{state.totals.spots} {t.hero.taken}
            </span>
            <span style={{ color: "#6e6e73" }}>
              {t.spots.startsAt} {formatMoney(cheapest, lang)}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", width: 520, height: 630, overflow: "hidden" }}>
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- rendered to PNG by next/og
            <img src={photo} width={520} height={721} style={{ objectFit: "cover", marginTop: -20 }} />
          )}
        </div>
      </div>
    ),
    { ...ogSize, headers: { "cache-control": `public, max-age=300` } },
  );
}

export const ogAlt = `${site.name} — ${site.event.name}`;
