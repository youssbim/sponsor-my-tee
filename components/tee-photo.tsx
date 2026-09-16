"use client";

import Image from "next/image";
import { formatSize } from "@/lib/format";
import { dict } from "@/lib/i18n";
import { spots, type Side, type Spot } from "@/lib/spots";
import { photoSpots, sleevePhotos, teePhotos, type PhotoRect } from "@/lib/tee-photo";
import type { SpotState } from "@/lib/types";
import { useMoney } from "./money";

type TeePhotoProps = {
  side: Side;
  states: Record<string, SpotState>;
  highlight?: string | null;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
  /** Only draw the spots, no interaction — used for thumbnails. */
  static?: boolean;
  /** Zoom into one spot (thumbnails). */
  focus?: string;
  /** Show a not-yet-uploaded logo inside one spot (bid dialog preview). */
  preview?: { spotId: string; src: string };
  /** Show only this spot, highlighted, on a torso crop: a "where is it" thumbnail. */
  locate?: string;
  /** Keep the print area outlined even when a logo fills it (admin previews). */
  area?: boolean;
  /** Render only this side (no flip), e.g. front and back side by side. */
  fixed?: boolean;
  priority?: boolean;
  className?: string;
};

export function TeePhoto({ side, states, highlight, onHover, onSelect, static: isStatic, focus, preview, locate, area, fixed, priority, className = "" }: TeePhotoProps) {
  const { lang } = useMoney();
  const t = dict(lang);
  const zoom = focus ? photoSpots[focus] : undefined;
  const { width, height } = teePhotos.front;

  // A single sleeve spot gets its own close-up instead of the body shot.
  const sleeveId = locate ?? focus;
  const sleeve = sleeveId ? sleevePhotos[sleeveId] : undefined;
  if (sleeve) {
    const spot = spots.find((s) => s.id === sleeveId)!;
    return (
      <div
        className={`@container relative overflow-hidden ${className}`}
        style={{ aspectRatio: `${sleeve.width} / ${sleeve.height}` }}
        role={isStatic ? "img" : "group"}
        aria-label={`${spot.name[lang]} — ${formatSize(spot, lang)}`}
      >
        <Image src={sleeve.src} alt="" fill sizes="220px" draggable={false} className="object-cover mix-blend-multiply select-none" />
        <PhotoSpot
          spot={spot}
          rect={sleeve.rect}
          state={states[spot.id]}
          active={highlight === spot.id}
          located={area || !states[spot.id]?.leader?.logoUrl}
          interactive={!isStatic}
          label={`${spot.name[lang]} · ${formatSize(spot, lang)}`}
          reviewLabel={t.tee.inReview}
          previewSrc={preview?.spotId === spot.id ? preview.src : undefined}
          onHover={onHover}
          onSelect={onSelect}
        />
      </div>
    );
  }

  return (
    <div
      className={`@container relative overflow-hidden ${className}`}
      style={{ aspectRatio: `${width} / ${height}` }}
      role={isStatic ? "img" : "group"}
      aria-label={`${side === "front" ? t.tee.front : t.tee.back} — ${t.tee.tapHint}`}
    >
      <div
        className="absolute inset-0"
        style={
          zoom
            ? { transform: "scale(2.4)", transformOrigin: `${zoom.x + zoom.w / 2}% ${zoom.y + zoom.h / 2}%` }
            : locate
              ? { transform: "scale(1.55)", transformOrigin: "50% 46%" }
              : undefined
        }
      >
        {/* Both sides stay mounted so flipping is instant and cross-fades. */}
        {(fixed ? [side] : (["front", "back"] as const)).map((s) => (
          <div
            key={s}
            aria-hidden={s !== side}
            className={`absolute inset-0 transition-opacity duration-300 ${s === side ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <Image
              src={teePhotos[s].src}
              alt=""
              fill
              sizes={focus || locate ? "160px" : fixed ? "(min-width: 768px) 400px, 50vw" : "(min-width: 1024px) 560px, 100vw"}
              priority={priority && (fixed || s === "front")}
              loading={priority ? "eager" : undefined}
              draggable={false}
              className="object-cover mix-blend-multiply select-none"
            />
            {spots
              .filter((spot) => spot.side === s && photoSpots[spot.id] && !sleevePhotos[spot.id] && (!locate || spot.id === locate))
              .map((spot) => (
                <PhotoSpot
                  key={spot.id}
                  spot={spot}
                  rect={photoSpots[spot.id]}
                  state={states[spot.id]}
                  active={highlight === spot.id}
                  located={locate === spot.id && (area || !states[spot.id]?.leader?.logoUrl)}
                  interactive={!isStatic && s === side}
                  label={`${spot.id} · ${spot.name[lang]} · ${formatSize(spot, lang)}`}
                  reviewLabel={t.tee.inReview}
                  previewSrc={preview?.spotId === spot.id ? preview.src : undefined}
                  onHover={onHover}
                  onSelect={onSelect}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotoSpot({
  spot,
  rect,
  state,
  active,
  located,
  interactive,
  label,
  reviewLabel,
  previewSrc,
  onHover,
  onSelect,
}: {
  spot: Spot;
  rect: PhotoRect;
  state: SpotState | undefined;
  active: boolean;
  located?: boolean;
  interactive: boolean;
  label: string;
  reviewLabel: string;
  previewSrc?: string;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
}) {
  const leader = state?.leader ?? null;
  const locked = state ? !state.open : false;
  const logo = previewSrc ?? leader?.logoUrl ?? null;
  const scale = previewSrc ? 100 : (leader?.logoScale ?? 100);
  const offsetX = previewSrc ? 0 : (leader?.logoOffsetX ?? 0);
  const offsetY = previewSrc ? 0 : (leader?.logoOffsetY ?? 0);
  const transform = scale !== 100 || offsetX || offsetY ? `translate(${offsetX}%, ${offsetY}%) scale(${scale / 100})` : undefined;
  const wide = rect.w > 20;

  const tone = located
    ? logo
      ? "border-dashed border-blue/70"
      : "border-solid border-blue bg-blue/25 shadow-[0_0_0_3px_rgba(38,86,232,0.25)]"
    : active
    ? "border-solid border-ink bg-ink/5"
    : logo
      ? "border-transparent"
      : locked
        ? "border-dotted border-ink/25"
        : "border-dashed border-ink/50";

  const body = logo ? (
    // eslint-disable-next-line @next/next/no-img-element -- sponsor logos come from any origin
    <img
      src={logo}
      alt=""
      className="pointer-events-none size-full object-contain"
      style={transform ? { transform } : undefined}
      draggable={false}
    />
  ) : (
    <span
      className={`pointer-events-none font-mono leading-none font-medium ${locked ? "text-ink/30" : "text-ink/70"} ${
        rect.w < 6 ? "text-[1.15cqw]" : "text-[1.7cqw]"
      }`}
    >
      {located ? "" : leader && wide ? reviewLabel : spot.id}
    </span>
  );

  const className = `absolute grid place-items-center rounded-[0.7cqw] border-[1.5px] transition-colors duration-150 ${tone} ${
    leader && !logo ? "bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.08)_0_2px,transparent_2px_7px)]" : ""
  }`;
  const style = { left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.w}%`, height: `${rect.h}%` };

  if (!interactive) {
    return (
      <div className={className} style={style} aria-hidden="true">
        {body}
      </div>
    );
  }
  return (
    <button
      type="button"
      aria-label={label}
      className={`${className} cursor-pointer outline-none before:absolute before:-inset-2 before:content-[''] focus-visible:border-solid focus-visible:border-ink`}
      style={style}
      onClick={() => onSelect?.(spot.id)}
      onPointerEnter={() => onHover?.(spot.id)}
      onPointerLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(spot.id)}
      onBlur={() => onHover?.(null)}
    >
      {body}
    </button>
  );
}
