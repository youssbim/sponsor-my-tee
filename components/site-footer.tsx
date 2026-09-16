import Link from "next/link";
import { site } from "@/lib/config";
import { dict, localePath } from "@/lib/i18n";
import type { Lang } from "@/lib/spots";

export function SiteFooter({ lang }: { lang: Lang }) {
  const t = dict(lang);
  return (
    <footer className="mx-auto mt-20 max-w-5xl px-4 sm:px-6">
      <div className="grid gap-6 border-t border-line py-10 text-[15px] text-ink-2 md:grid-cols-[1fr_auto]">
        <div className="space-y-1">
          <p>
            {t.home.footerQuestions}{" "}
            <a href={`mailto:${site.owner.email}`} className="font-semibold text-blue hover:underline">
              {site.owner.email}
            </a>
          </p>
          <p>
            {t.home.footerPortfolio}{" "}
            <a href={site.owner.portfolio} className="font-semibold text-blue hover:underline">
              example.com
            </a>
          </p>
          <p className="max-w-[60ch] pt-3 text-[12px] leading-relaxed text-ink-3">{t.footer.disclaimer}</p>
        </div>
        <div className="flex flex-col gap-4 md:items-end">
          <a
            href={site.owner.linkedin}
            target="_blank"
            rel="noopener"
            className="inline-flex h-10 items-center gap-2 self-start rounded-full bg-ink px-4 font-mono text-[14px] font-semibold text-paper transition-opacity hover:opacity-85 md:self-end"
          >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
              <path
                fill="currentColor"
                d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"
              />
            </svg>
            {site.owner.name}
          </a>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-[14px] font-medium" aria-label="Footer">
            <Link href={localePath(lang, "/leaderboard")} className="hover:text-ink">
              {t.nav.leaderboard}
            </Link>
            <Link href={localePath(lang, "/terms")} className="hover:text-ink">
              {t.footer.terms}
            </Link>
            <Link href={localePath(lang, "/privacy")} className="hover:text-ink">
              {t.footer.privacy}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
