"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { formatMoney, formatSize } from "@/lib/format";
import { dict, localePath } from "@/lib/i18n";
import { spotById } from "@/lib/spots";
import { LOGO_TYPES, MAX_LOGO_BYTES } from "@/lib/validation";
import { useAuction } from "../auction-provider";
import { useMoney } from "../money";
import { Field, inputClass, Sheet } from "../sheet";
import { TeePhoto } from "../tee-photo";

const DRAFT_KEY = "otb.bidder";

type Draft = { brand: string; url: string; xHandle: string; email: string };

/** Brand details from the last bid on this device. */
function readDraft(): Draft {
  const empty = { brand: "", url: "", xHandle: "", email: "" };
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    return saved ? { ...empty, ...(JSON.parse(saved) as Partial<Draft>) } : empty;
  } catch {
    return empty;
  }
}

export function BidDialog() {
  const { bidSpot, closeBid, state } = useAuction();
  const { lang } = useMoney();
  const t = dict(lang).dialog;
  const spot = bidSpot ? spotById.get(bidSpot) : undefined;

  return (
    <Sheet open={Boolean(spot)} onClose={closeBid} label={spot ? `${spot.id} · ${spot.name[lang]}` : ""} closeLabel={t.close}>
      {spot && <BidForm key={spot.id} spotId={spot.id} enabled={state.enabled && !state.closed} />}
    </Sheet>
  );
}

function BidForm({ spotId, enabled }: { spotId: string; enabled: boolean }) {
  const { state } = useAuction();
  const { lang, money, currency } = useMoney();
  const t = dict(lang);
  const id = useId();
  const spot = spotById.get(spotId)!;
  const spotState = state.spots[spotId];
  const minimum = spotState.nextMin;

  const [amount, setAmount] = useState(String(minimum));
  // The form only mounts in the browser (the dialog opens on click), so localStorage is safe here.
  const [draft, setDraft] = useState<Draft>(readDraft);
  const [logo, setLogo] = useState<File | null>(null);
  const [includesName, setIncludesName] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Someone outbid while the dialog was open: move the floor up.
  const [seenMinimum, setSeenMinimum] = useState(minimum);
  if (seenMinimum !== minimum) {
    setSeenMinimum(minimum);
    if (Number(amount) < minimum) setAmount(String(minimum));
  }

  const preview = useMemo(() => (logo ? URL.createObjectURL(logo) : null), [logo]);
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);

  const numeric = Math.round(Number(amount));
  const validAmount = Number.isFinite(numeric) && numeric >= minimum;
  const total = validAmount ? numeric : minimum;

  const pickLogo = (file: File | undefined) => {
    if (!file) return;
    if (!LOGO_TYPES[file.type]) return setError(t.errors.logoType);
    if (file.size > MAX_LOGO_BYTES) return setError(t.errors.logoSize);
    setError(null);
    setLogo(file);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!enabled) return setError(state.closed ? t.errors.closed : t.errors.notOpen);
    if (!validAmount) return setError(t.errors.amount(formatMoney(minimum, lang)));
    if (!draft.brand.trim()) return setError(t.errors.brand);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(draft.email.trim())) return setError(t.errors.email);
    if (!logo) return setError(t.errors.logo);
    if (!terms) return setError(t.errors.terms);

    setError(null);
    setBusy(true);
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}

    const body = new FormData(e.currentTarget);
    body.set("spotId", spot.id);
    body.set("lang", lang);
    body.set("amount", String(numeric));
    body.set("logo", logo);

    try {
      const res = await fetch("/api/bids", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { checkoutUrl?: string; error?: string; minimum?: number };
      if (!res.ok || !data.checkoutUrl) {
        setError(data.error ?? t.errors.generic);
        if (typeof data.minimum === "number") setAmount(String(data.minimum));
        setBusy(false);
        return;
      }
      window.location.assign(data.checkoutUrl);
    } catch {
      setError(t.errors.network);
      setBusy(false);
    }
  };

  const bump = (by: number) => setAmount(String(Math.max(minimum, (validAmount ? numeric : minimum) + by)));

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 p-5 sm:p-7">
      <header className="flex items-start gap-4 pr-10">
        <figure className="w-36 shrink-0 sm:w-44">
          <div className="overflow-hidden rounded-2xl border border-line">
            <TeePhoto
              side={spot.side}
              states={{ [spot.id]: spotState }}
              highlight={preview ? null : spot.id}
              focus={spot.id}
              preview={preview ? { spotId: spot.id, src: preview } : undefined}
              static
              className="w-full"
            />
          </div>
          <figcaption className="mt-1.5 text-center text-[11px] text-ink-3">{t.dialog.logoPreview}</figcaption>
        </figure>
        <div className="min-w-0">
          <p className="flex items-center gap-2">
            <span className="rounded-md bg-tee px-1.5 py-0.5 font-mono text-[11px] font-medium text-paper">{spot.id}</span>
            <span className="font-mono text-[12px] text-ink-2">{formatSize(spot, lang)}</span>
          </p>
          <h2 className="mt-1 text-[22px] font-semibold tracking-tight">{spot.name[lang]}</h2>
          <p className="mt-0.5 text-[13px] leading-snug text-ink-2">{spot.seen[lang]}</p>
        </div>
      </header>

      <div className="flex items-center justify-between rounded-2xl bg-snow px-4 py-3 text-[13px]">
        <span className="text-ink-2">{spotState.leader ? t.dialog.current : t.dialog.opening}</span>
        <span className="tabular text-[17px] font-semibold">{money(spotState.leader?.amount ?? spot.min)}</span>
      </div>

      <Field id={`${id}-amount`} label={`${t.dialog.yourBid} (EUR)`} hint={`${t.dialog.minimum} ${formatMoney(minimum, lang)}`}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[15px] text-ink-2">€</span>
            <input
              id={`${id}-amount`}
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
              className={`${inputClass} tabular pl-8 text-[17px] font-semibold`}
              data-autofocus
            />
          </div>
          {[10, 50].map((n) => (
            <button key={n} type="button" onClick={() => bump(n)} className="tabular h-11 rounded-xl border border-line px-3 text-[13px] font-medium text-ink-2 hover:border-ink/30 hover:text-ink">
              +{n}
            </button>
          ))}
        </div>
        {currency === "USD" && validAmount && <p className="tabular text-[12px] text-ink-3">≈ {money(numeric)}</p>}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${id}-brand`} label={t.dialog.brand}>
          <input
            id={`${id}-brand`}
            name="brand"
            autoComplete="organization"
            maxLength={60}
            placeholder={t.dialog.brandPlaceholder}
            value={draft.brand}
            onChange={(e) => setDraft({ ...draft, brand: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field id={`${id}-email`} label={t.dialog.email}>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            value={draft.email}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field id={`${id}-url`} label={t.dialog.website} optional={t.dialog.optional}>
          <input
            id={`${id}-url`}
            name="url"
            inputMode="url"
            autoComplete="url"
            placeholder={t.dialog.websitePlaceholder}
            value={draft.url}
            onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field id={`${id}-x`} label={t.dialog.xHandle} optional={t.dialog.optional}>
          <input
            id={`${id}-x`}
            name="xHandle"
            autoCapitalize="none"
            placeholder={t.dialog.xPlaceholder}
            value={draft.xHandle}
            onChange={(e) => setDraft({ ...draft, xHandle: e.target.value })}
            className={inputClass}
          />
        </Field>
      </div>
      <p className="-mt-3 text-[12px] text-ink-3">{t.dialog.emailHint}</p>

      <div className="grid gap-1.5">
        <span className="text-[13px] font-medium">{t.dialog.logo}</span>
        <label
          htmlFor={`${id}-logo`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pickLogo(e.dataTransfer.files[0]);
          }}
          className={`grid cursor-pointer gap-3 rounded-2xl border border-dashed p-4 transition-colors ${
            dragging ? "border-blue bg-blue-soft" : "border-line hover:border-ink/30"
          }`}
        >
          <span className="grid content-center gap-1 px-1 text-[13px]">
            <span className="font-medium text-ink">{logo ? logo.name : t.dialog.logoDrop}</span>
            <span className="text-[12px] text-ink-3">{t.dialog.logoHint}</span>
          </span>
        </label>
        <input
          id={`${id}-logo`}
          type="file"
          accept={Object.keys(LOGO_TYPES).join(",")}
          className="sr-only"
          onChange={(e) => pickLogo(e.target.files?.[0])}
        />
        <label className="mt-1 flex items-center gap-2 text-[13px] text-ink-2">
          <input
            type="checkbox"
            name="logoIncludesName"
            checked={includesName}
            onChange={(e) => setIncludesName(e.target.checked)}
            className="size-4 accent-ink"
          />
          {t.dialog.logoIncludesName}
        </label>
      </div>

      {/* Hidden from people, tempting for bots. */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="grid gap-3 rounded-2xl border border-line p-4">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-[14px] font-medium">{t.dialog.payNow}</p>
            <p className="text-[12px] text-ink-2">{t.dialog.payNote}</p>
          </div>
          <p className="tabular text-[22px] font-semibold tracking-tight">{formatMoney(total, lang)}</p>
        </div>
        <label className="flex items-center gap-2 text-[13px] text-ink-2">
          <input type="checkbox" name="terms" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="size-4 accent-ink" />
          <span>
            {t.dialog.terms}{" "}
            <Link href={localePath(lang, "/terms")} target="_blank" className="text-blue hover:underline">
              {t.dialog.termsLink}
            </Link>
          </span>
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red/8 px-3.5 py-2.5 text-[13px] text-red">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !enabled}
        className="tabular h-12 rounded-full bg-ink text-[15px] font-medium text-paper transition-opacity hover:opacity-85 disabled:opacity-40"
      >
        {busy ? t.dialog.paying : enabled ? `${t.dialog.pay} · ${formatMoney(total, lang)}` : state.closed ? t.dialog.closedNote : t.dialog.notOpen}
      </button>
    </form>
  );
}
