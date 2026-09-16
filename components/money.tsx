"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { formatMoney, type Currency } from "@/lib/format";
import type { Lang } from "@/lib/spots";

type MoneyContext = {
  lang: Lang;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  money: (eur: number) => string;
};

const Ctx = createContext<MoneyContext | null>(null);
const KEY = "otb.currency";

// The currency preference lives in localStorage; this keeps every component in sync with it.
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readCurrency(): Currency {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "USD" || saved === "EUR") return saved;
  } catch {}
  // No choice yet: euros in Italy (or when the country is unknown), dollars elsewhere.
  const country = document.cookie.match(/(?:^|; )otb\.country=([A-Z]{2})/)?.[1];
  return !country || country === "IT" ? "EUR" : "USD";
}

export function MoneyProvider({ lang, usdRate, children }: { lang: Lang; usdRate: number; children: React.ReactNode }) {
  const currency = useSyncExternalStore(subscribe, readCurrency, () => "EUR" as const);

  const setCurrency = useCallback((c: Currency) => {
    try {
      localStorage.setItem(KEY, c);
    } catch {}
    listeners.forEach((l) => l());
  }, []);

  const value = useMemo<MoneyContext>(
    () => ({ lang, currency, setCurrency, money: (eur) => formatMoney(eur, lang, currency, usdRate) }),
    [lang, currency, setCurrency, usdRate],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMoney() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMoney must be used inside MoneyProvider");
  return ctx;
}

export function CurrencyToggle() {
  const { currency, setCurrency } = useMoney();
  return (
    <div role="group" aria-label="Currency" className="flex rounded-full bg-snow p-0.5 text-[12px] font-medium">
      {(["EUR", "USD"] as const).map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={currency === c}
          onClick={() => setCurrency(c)}
          className={`h-7 min-w-8 rounded-full px-2 transition-colors ${
            currency === c ? "bg-paper text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "text-ink-2 hover:text-ink"
          }`}
        >
          {c === "EUR" ? "€" : "$"}
        </button>
      ))}
    </div>
  );
}
