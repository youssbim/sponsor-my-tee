"use client";

import { useRouter } from "next/navigation";
import { TeePhoto } from "@/components/tee-photo";
import { spotById } from "@/lib/spots";
import { photoSpots, sleevePhotos, teePhotos } from "@/lib/tee-photo";
import type { SpotState } from "@/lib/types";
import { useActionState, useState, useTransition } from "react";
import { loginAction, removeSponsorAction, setGoalAction, setLogoScaleAction, setSponsorAction } from "./actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="mx-auto mt-24 grid w-full max-w-xs gap-3">
      <h1 className="text-[22px] font-semibold tracking-tight">Admin</h1>
      <label htmlFor="admin-password" className="text-[13px] font-medium">
        Password
      </label>
      <input
        id="admin-password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className="h-11 rounded-xl border border-line px-3.5 text-[15px] focus:border-blue focus:outline-none"
      />
      {error && <p className="text-[13px] text-red">{error}</p>}
      <button disabled={pending} className="h-11 rounded-full bg-ink text-[15px] font-medium text-paper disabled:opacity-50">
        Sign in
      </button>
    </form>
  );
}

export function SponsorForm({ spotId, min, replacing }: { spotId: string; min: number; replacing: boolean }) {
  const [result, action, pending] = useActionState(setSponsorAction, null);
  const input = "h-9 rounded-lg border border-line bg-paper px-2.5 text-[13px] focus:border-blue focus:outline-none";
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-[1.2fr_0.7fr_1fr_1fr_1.3fr_auto] sm:items-center">
      <input type="hidden" name="spotId" value={spotId} />
      <input name="brand" placeholder="Brand" required className={input} />
      <input name="amount" inputMode="numeric" placeholder={`€ ${min}`} required className={`${input} tabular`} />
      <input name="url" placeholder="sito.com (facoltativo)" className={input} />
      <input name="email" type="email" placeholder="email (facoltativa)" className={input} />
      <input name="logo" type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp" required className="text-[12px] file:mr-2 file:h-8 file:rounded-full file:border-0 file:bg-snow file:px-3 file:text-[12px]" />
      <button disabled={pending} className="h-9 rounded-full bg-ink px-4 text-[13px] font-medium whitespace-nowrap text-paper disabled:opacity-50">
        {pending ? "Salvo…" : replacing ? "Sostituisci" : "Imposta"}
      </button>
      {result && result !== "ok" && <p className="text-[12px] text-red sm:col-span-6">{result}</p>}
    </form>
  );
}

export function RemoveSponsorButton({ id, brand }: { id: string; brand: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const remove = () => {
    if (!window.confirm(`Rimuovere ${brand} da questo spazio?`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await removeSponsorAction(id);
        router.refresh();
      } catch {
        // Usually a page left open across a deploy: its action ids no longer exist.
        setError("Non riuscito. Ricarica la pagina e riprova.");
      }
    });
  };

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="h-8 rounded-full bg-snow px-3 text-[12px] font-medium text-red disabled:opacity-50"
      >
        {pending ? "Rimuovo…" : "Rimuovi"}
      </button>
      {error && <span className="text-[12px] text-red">{error}</span>}
    </span>
  );
}

/** Size and position of a sponsor's logo inside its spot, previewed live on the tee photo. */
export function LogoScaleControl({
  id,
  spotId,
  brand,
  logoUrl,
  scale,
  offsetX,
  offsetY,
}: {
  id: string;
  spotId: string;
  brand: string;
  logoUrl: string;
  scale: number;
  offsetX: number;
  offsetY: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(scale);
  const [x, setX] = useState(offsetX);
  const [y, setY] = useState(offsetY);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const spot = spotById.get(spotId)!;
  const rect = photoSpots[spotId];
  const centerY = rect.y + rect.h / 2;
  const sleeve = Boolean(sleevePhotos[spotId]);
  const dirty = value !== scale || x !== offsetX || y !== offsetY;

  const clamp = (v: number) => Math.max(-100, Math.min(100, v));
  const nudge = (dx: number, dy: number) => {
    setX((v) => clamp(v + dx));
    setY((v) => clamp(v + dy));
  };

  const save = () => {
    setError(null);
    startTransition(async () => {
      try {
        await setLogoScaleAction(id, value, x, y);
        router.refresh();
      } catch {
        setError("Non salvato. Ricarica la pagina e riprova.");
      }
    });
  };

  const state: SpotState = {
    id: spotId,
    leader: {
      id,
      spotId,
      amount: 0,
      at: "",
      standing: true,
      brand,
      logoUrl,
      url: null,
      xHandle: null,
      logoIncludesName: true,
      logoScale: value,
      logoOffsetX: x,
      logoOffsetY: y,
    },
    bidCount: 1,
    nextMin: 0,
    open: true,
  };

  const arrow = "grid size-8 place-items-center rounded-lg border border-line bg-card text-[13px] text-ink hover:border-ink/30";

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div
        tabIndex={0}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 1 : 5;
          const moves: Record<string, [number, number]> = { ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] };
          const move = moves[e.key];
          if (!move) return;
          e.preventDefault();
          nudge(...move);
        }}
        title="Usa le frecce della tastiera (Maiusc per spostamenti fini)"
        className={`relative w-56 shrink-0 overflow-hidden rounded-xl border border-line bg-white outline-none focus-visible:ring-2 focus-visible:ring-blue ${sleeve ? "" : "aspect-square"}`}
      >
        {/* Square crop centred on the spot; sleeve close-ups already frame the spot. */}
        <div style={sleeve ? undefined : { marginTop: `calc(50% - ${centerY * (teePhotos.front.height / teePhotos.front.width)}%)` }}>
          <TeePhoto side={spot.side} fixed static area states={{ [spotId]: state }} focus={spotId} locate={spotId} className="w-full" />
        </div>
      </div>
      <div className="grid gap-3">
        <label className="flex items-center gap-2 text-[12px] text-ink-2">
          Grandezza logo
          <input type="range" min={25} max={300} step={5} value={value} onChange={(e) => setValue(Number(e.target.value))} className="w-48 accent-ink" />
          <span className="tabular w-10 font-medium text-ink">{value}%</span>
        </label>

        <div className="flex items-center gap-4">
          <div className="grid grid-cols-3 gap-1" aria-label="Posizione logo">
            <span />
            <button type="button" onClick={() => nudge(0, -5)} className={arrow} aria-label="Su">
              ↑
            </button>
            <span />
            <button type="button" onClick={() => nudge(-5, 0)} className={arrow} aria-label="Sinistra">
              ←
            </button>
            <button type="button" onClick={() => { setX(0); setY(0); }} className={`${arrow} text-[10px]`} aria-label="Centra" title="Centra">
              ●
            </button>
            <button type="button" onClick={() => nudge(5, 0)} className={arrow} aria-label="Destra">
              →
            </button>
            <span />
            <button type="button" onClick={() => nudge(0, 5)} className={arrow} aria-label="Giù">
              ↓
            </button>
            <span />
          </div>
          <p className="tabular text-[12px] text-ink-2">
            Posizione
            <br />
            <span className="font-medium text-ink">
              x {x > 0 ? "+" : ""}
              {x}% · y {y > 0 ? "+" : ""}
              {y}%
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={!dirty || pending}
            className="h-8 rounded-full bg-ink px-4 text-[12px] font-medium text-paper disabled:opacity-30"
          >
            {pending ? "Salvo…" : dirty ? "Salva" : "Salvato"}
          </button>
          {(value !== 100 || x !== 0 || y !== 0) && (
            <button
              type="button"
              onClick={() => {
                setValue(100);
                setX(0);
                setY(0);
              }}
              className="text-[12px] text-ink-2 underline"
            >
              Ripristina
            </button>
          )}
          {dirty && !pending && (
            <button
              type="button"
              onClick={() => {
                setValue(scale);
                setX(offsetX);
                setY(offsetY);
              }}
              className="text-[12px] text-ink-2 underline"
            >
              Annulla
            </button>
          )}
        </div>
        <p className="text-[12px] text-ink-3">Il riquadro blu tratteggiato è lo spazio di stampa. Frecce: 5% per click (Maiusc + tastiera: 1%).</p>
        {error && <span className="text-[12px] text-red">{error}</span>}
      </div>
    </div>
  );
}

/** The fundraising goal shown in the hero. */
export function GoalForm({ goal }: { goal: number }) {
  const [result, action, pending] = useActionState(setGoalAction, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2 text-[13px]">
      <label htmlFor="goal" className="text-ink-2">
        Obiettivo
      </label>
      <span className="relative">
        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[13px] text-ink-2">€</span>
        <input
          id="goal"
          name="goal"
          inputMode="numeric"
          defaultValue={goal}
          className="tabular h-9 w-28 rounded-lg border border-line bg-paper pl-6 text-[13px] focus:border-blue focus:outline-none"
        />
      </span>
      <button disabled={pending} className="h-9 rounded-full bg-ink px-4 text-[12px] font-medium text-paper disabled:opacity-50">
        {pending ? "Salvo…" : "Salva"}
      </button>
      {result && result !== "ok" && <span className="text-[12px] text-red">{result}</span>}
      {result === "ok" && <span className="text-[12px] text-green">Salvato</span>}
    </form>
  );
}
