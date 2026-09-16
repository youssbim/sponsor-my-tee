"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { site } from "@/lib/config";
import { dict, localePath } from "@/lib/i18n";
import { CurrencyToggle, useMoney } from "./money";

export function TeeGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M9 3.5c.6 1.3 1.7 2 3 2s2.4-.7 3-2l4.4 1.9 2.1 4.6-3.2 1.5-.9-1.6V20.5H6.6V9.9l-.9 1.6L2.5 10l2.1-4.6L9 3.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SiteHeader({ onCta }: { onCta?: () => void }) {
  const { lang } = useMoney();
  const t = dict(lang).nav;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const home = localePath(lang, "/");
  // The root page can be served internally as /index, which must never leak into links.
  const bare = pathname.replace(/\/index$/, "").replace(/^\/it(?=\/|$)/, "") || "/";
  const other = lang === "it" ? bare : localePath("it", bare);

  const links = [
    { id: "how", href: `${home}#how`, label: t.how },
    { id: "perks", href: `${home}#perks`, label: t.perks },
    { id: "about", href: `${home}#about`, label: t.about },
  ];

  const ctaClass = "hidden h-10 items-center rounded-full bg-ink px-5 text-[14px] font-semibold text-paper transition-opacity hover:opacity-85 sm:inline-flex";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4 sm:px-6">
        <Link href={home} className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Image src="/avatar.jpg" alt="" width={32} height={32} className="size-8 rounded-full object-cover" priority />
          <span className="font-mono text-[17px] font-semibold tracking-tight">{site.name}</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link key={l.id} href={l.href} className="text-[14px] text-ink-2 transition-colors hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <CurrencyToggle />
          <a
            href={other}
            hrefLang={lang === "it" ? "en" : "it"}
            onClick={() => {
              document.cookie = `otb.lang=${lang === "it" ? "en" : "it"}; path=/; max-age=31536000; samesite=lax`;
            }}
            className="grid h-9 min-w-9 place-items-center rounded-full px-2 font-mono text-[12px] font-semibold text-ink-2 transition-colors hover:bg-snow hover:text-ink"
          >
            {lang === "it" ? "EN" : "IT"}
          </a>
          {onCta ? (
            <button type="button" onClick={onCta} className={`${ctaClass} ml-2`}>
              {t.cta}
            </button>
          ) : (
            <Link href={`${home}#spots`} className={`${ctaClass} ml-2`}>
              {t.cta}
            </Link>
          )}
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full text-ink hover:bg-snow md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="sr-only">{t.menu}</span>
            <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
              <motion.path animate={{ d: open ? "M5 5l10 10" : "M3 7h14" }} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <motion.path animate={{ d: open ? "M15 5L5 15" : "M3 13h14" }} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.nav
            id="mobile-nav"
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-line md:hidden"
          >
            <div className="grid gap-1 px-4 py-3">
              {links.map((l) => (
                <Link key={l.id} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-[16px] font-medium hover:bg-snow">
                  {l.label}
                </Link>
              ))}
              <Link
                href={`${home}#spots`}
                onClick={() => setOpen(false)}
                className="mt-1 grid h-12 place-items-center rounded-full bg-ink text-[15px] font-semibold text-paper"
              >
                {t.cta}
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
