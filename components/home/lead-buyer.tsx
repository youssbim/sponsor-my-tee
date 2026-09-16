"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useId, useState } from "react";
import { dict, localePath } from "@/lib/i18n";
import { spotById, spots } from "@/lib/spots";
import { LOGO_TYPES, MAX_LOGO_BYTES } from "@/lib/validation";
import { useAuction } from "../auction-provider";
import { useMoney } from "../money";
import { Field, inputClass, Sheet } from "../sheet";
import { BrandMark } from "../ui";

/** The brand that has spent the most, with a one-click way to take every spot it holds. */
export function LeadBuyerBadge() {
  const { state, myBids } = useAuction();
  const { lang, money } = useMoney();
  const t = dict(lang).home;
  const [open, setOpen] = useState(false);
  const top = state.topBuyer;
  if (!top) return null;

  // Don't dare the lead buyer to outbid themselves.
  const mine = top.spots.every((s) => myBids.some((b) => b.spotId === s.spotId && b.status === "active"));

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6"
      >
        <div className="inline-flex max-w-full items-center gap-2.5 rounded-full border border-line bg-card py-1.5 pr-1.5 pl-2 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.35)]">
          <span className="relative shrink-0">
            <BrandMark name={top.brand} logoUrl={top.logoUrl} url={top.url} xHandle={top.xHandle} size={30} dark />
            <span className="absolute -top-2 -right-1.5 text-[12px]" aria-hidden="true">
              👑
            </span>
          </span>
          <span className="tabular min-w-0 truncate text-[13px] text-ink-2">
            <span className="hidden sm:inline">{t.leadBuyer} </span>
            <span className="font-semibold text-ink">{top.brand}</span> · {money(top.total)}
          </span>
          {!state.closed && !mine && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="tabular h-8 shrink-0 rounded-full bg-ink px-3.5 text-[13px] font-semibold whitespace-nowrap text-paper transition-transform hover:-translate-y-px"
            >
              {t.takeAll(money(top.takeoverTotal))}
            </button>
          )}
        </div>
      </motion.div>

      <Sheet open={open} onClose={() => setOpen(false)} label={t.bundleTitle(top.brand)} closeLabel={dict(lang).dialog.close}>
        {open && (
          <BundleForm
            scope="top"
            title={t.bundleTitle(top.brand)}
            lead={t.bundleLead}
            items={top.spots.map((s) => ({ spotId: s.spotId, current: s.amount, price: s.nextMin }))}
          />
        )}
      </Sheet>
    </>
  );
}

type BundleItem = { spotId: string; current: number | null; price: number };

function BundleForm({ items, title, lead, scope }: { items: BundleItem[]; title: string; lead: string; scope: "top" | "all" }) {
  const { lang, money } = useMoney();
  const t = dict(lang);
  const id = useId();
  const [logo, setLogo] = useState<File | null>(null);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const total = items.reduce((sum, i) => sum + i.price, 0);

  const pickLogo = (file: File | undefined) => {
    if (!file) return;
    if (!LOGO_TYPES[file.type]) return setError(t.errors.logoType);
    if (file.size > MAX_LOGO_BYTES) return setError(t.errors.logoSize);
    setError(null);
    setLogo(file);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const body = new FormData(e.currentTarget);
    if (!String(body.get("brand") ?? "").trim()) return setError(t.errors.brand);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(body.get("email") ?? "").trim())) return setError(t.errors.email);
    if (!logo) return setError(t.errors.logo);
    if (!terms) return setError(t.errors.terms);

    setError(null);
    setBusy(true);
    body.set("lang", lang);
    body.set("logo", logo);
    body.set("scope", scope);
    body.set("spotIds", items.map((s) => s.spotId).join(","));
    try {
      const res = await fetch("/api/bids/bundle", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) {
        setError(data.error ?? t.errors.generic);
        setBusy(false);
        return;
      }
      window.location.assign(data.checkoutUrl);
    } catch {
      setError(t.errors.network);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 p-5 text-left sm:p-7">
      <header className="pr-10">
        <h2 className="text-[22px] font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-[13px] leading-snug text-ink-2">{lead}</p>
      </header>

      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
        {items.map((s) => {
          const spot = spotById.get(s.spotId)!;
          return (
            <li key={s.spotId} className="tabular flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
              <span className="min-w-0">
                <span className="font-medium">{spot.name[lang]}</span> <span className="font-mono text-[11px] text-ink-3">· {spot.id}</span>
              </span>
              <span className="shrink-0 text-ink-2">
                {s.current !== null && <>{money(s.current)} → </>}
                <span className="font-semibold text-ink">{money(s.price)}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${id}-brand`} label={t.dialog.brand}>
          <input id={`${id}-brand`} name="brand" autoComplete="organization" maxLength={60} placeholder={t.dialog.brandPlaceholder} className={inputClass} data-autofocus />
        </Field>
        <Field id={`${id}-email`} label={t.dialog.email}>
          <input id={`${id}-email`} name="email" type="email" autoComplete="email" className={inputClass} />
        </Field>
      </div>

      <Field id={`${id}-url`} label={t.dialog.website} optional={t.dialog.optional}>
        <input id={`${id}-url`} name="url" inputMode="url" autoComplete="url" placeholder={t.dialog.websitePlaceholder} className={inputClass} />
      </Field>

      <div className="grid gap-1.5">
        <span className="text-[13px] font-medium">{t.dialog.logo}</span>
        <label htmlFor={`${id}-logo`} className="grid cursor-pointer gap-1 rounded-2xl border border-dashed border-line p-4 text-[13px] transition-colors hover:border-ink/30">
          <span className="font-medium text-ink">{logo ? logo.name : t.dialog.logoDrop}</span>
          <span className="text-[12px] text-ink-3">{t.dialog.logoHint}</span>
        </label>
        <input id={`${id}-logo`} type="file" accept={Object.keys(LOGO_TYPES).join(",")} className="sr-only" onChange={(e) => pickLogo(e.target.files?.[0])} />
      </div>

      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="grid gap-3 rounded-2xl border border-line p-4">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-[14px] font-medium">{t.home.bundleTotal}</p>
            <p className="text-[12px] text-ink-2">{t.home.bundleNote}</p>
          </div>
          <p className="tabular text-[22px] font-semibold tracking-tight">{money(total)}</p>
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

      <button type="submit" disabled={busy} className="tabular h-12 rounded-full bg-ink text-[15px] font-semibold text-paper transition-opacity hover:opacity-85 disabled:opacity-40">
        {busy ? t.dialog.paying : `${t.home.takeAll(money(total))}`}
      </button>
    </form>
  );
}

/** Not shown yet: buying the whole tee will be priced at the goal. */
export function BuyWholeTeeButton() {
  const { state } = useAuction();
  const { lang, money } = useMoney();
  const t = dict(lang).home;
  const [open, setOpen] = useState(false);

  const items = spots
    .filter((spot) => state.spots[spot.id])
    .map((spot) => ({ spotId: spot.id, current: state.spots[spot.id].leader?.amount ?? null, price: state.spots[spot.id].nextMin }));
  const total = items.reduce((sum, i) => sum + i.price, 0);
  if (state.closed || items.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tabular mt-4 inline-flex h-10 items-center gap-2 rounded-full border border-ink px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
      >
        👕 {t.buyAll(money(total))}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} label={t.buyAllTitle} closeLabel={dict(lang).dialog.close}>
        {open && <BundleForm scope="all" title={t.buyAllTitle} lead={t.buyAllLead} items={items} />}
      </Sheet>
    </>
  );
}
