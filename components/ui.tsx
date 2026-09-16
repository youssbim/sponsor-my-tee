"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { hostname } from "@/lib/format";

/**
 * Current time rounded to the interval, ticking. Null on the server and during hydration,
 * so relative times never cause a markup mismatch.
 */
export function useNow(intervalMs = 30_000) {
  const subscribe = useCallback(
    (onTick: () => void) => {
      const id = setInterval(onTick, intervalMs);
      return () => clearInterval(id);
    },
    [intervalMs],
  );
  return useSyncExternalStore<number | null>(
    subscribe,
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => null,
  );
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "?"
  );
}

/** Logo, X avatar or favicon, falling back to initials. */
export function BrandMark({
  name,
  logoUrl,
  url,
  xHandle,
  size = 32,
  dark = false,
}: {
  name: string;
  logoUrl?: string | null;
  url?: string | null;
  xHandle?: string | null;
  size?: number;
  dark?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src =
    logoUrl ??
    (xHandle
      ? `https://unavatar.io/x/${xHandle}`
      : url
        ? `https://www.google.com/s2/favicons?domain=${hostname(url)}&sz=128`
        : null);

  const box = `grid shrink-0 place-items-center overflow-hidden rounded-[22%] ${
    dark ? "border border-line bg-card text-ink" : "bg-snow text-ink-2"
  }`;

  if (!src || failed) {
    return (
      <span className={box} style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden="true">
        <span className="font-semibold">{initials(name)}</span>
      </span>
    );
  }
  return (
    <span className={box} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- remote logos of any origin, no optimisation needed */}
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className={logoUrl ? "size-full object-contain p-[12%]" : "size-full object-cover"}
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export function LiveDot({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-flex size-2 ${className}`} aria-hidden="true">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-green opacity-40" />
      <span className="relative inline-flex size-2 rounded-full bg-green" />
    </span>
  );
}

export function Chip({ tone = "neutral", children }: { tone?: "neutral" | "green" | "amber" | "blue"; children: React.ReactNode }) {
  const tones = {
    neutral: "bg-snow text-ink-2",
    green: "bg-green-soft text-green",
    amber: "bg-amber-soft text-amber",
    blue: "bg-blue-soft text-blue",
  };
  return (
    <span className={`inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  );
}
