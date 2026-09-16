import Image from "next/image";
import { site } from "@/lib/config";
import { eventStats } from "@/lib/event-stats";
import { dict, locale } from "@/lib/i18n";
import type { Lang } from "@/lib/spots";
import { Eyebrow } from "./section";

const h2 = "mt-1 text-[32px] font-medium tracking-[-0.03em] sm:text-[36px]";

export function SloganBand({ lang }: { lang: Lang }) {
  const t = dict(lang).home;
  return (
    <section className="bg-ink px-4 py-16 text-center text-paper sm:py-20">
      <p className="text-[36px] leading-tight font-medium tracking-[-0.03em] sm:text-[48px]">{t.bandTitle}</p>
      <p className="mt-2 text-[30px] leading-tight font-medium tracking-[-0.03em] text-paper/60 sm:text-[48px]">{t.bandSub}</p>
    </section>
  );
}

export function HowItWorks({ lang }: { lang: Lang }) {
  const t = dict(lang).home;
  return (
    <section id="how" className="mx-auto max-w-5xl px-4 pt-20 sm:px-6" aria-labelledby="how-title">
      <Eyebrow>{t.howEyebrow}</Eyebrow>
      <h2 id="how-title" className={h2}>
        {t.howTitle}
      </h2>
      <ol className="mt-6 grid gap-4 md:grid-cols-2">
        {t.howSteps.map((step, i) => (
          <li key={step.title} className="rounded-xl border border-line bg-card p-5">
            <span className="grid size-8 place-items-center rounded-full border border-line font-mono text-[13px] font-semibold text-blue">
              {i + 1}
            </span>
            <h3 className="mt-4 text-[17px] font-semibold tracking-tight">{step.title}</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function EventCard({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const nf = new Intl.NumberFormat(locale(lang), { useGrouping: "always" });
  const linkedin = eventStats.sources[2];
  return (
    <section className="mx-auto max-w-5xl px-4 pt-16 sm:px-6">
      <div className="rounded-xl border border-line bg-card p-6 sm:p-8">
        <Eyebrow>{t.home.eventEyebrow}</Eyebrow>
        <h2 className={h2}>
          {t.home.eventTitle}
        </h2>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-2">{t.home.eventBody}</p>

        <dl className="tabular mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
          {eventStats.numbers.map((stat) => (
            <div key={stat.key} className="flex flex-col bg-card p-3.5">
              <dt className="order-2 mt-1 text-[12px] leading-snug text-ink-2">{t.stats.labels[stat.key]}</dt>
              <dd className="order-1 text-[22px] leading-none font-semibold tracking-tight">
                {nf.format(stat.value)}
                {stat.plus ? "+" : ""}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 text-[14px] leading-relaxed text-ink-2">
          <span className="font-medium text-ink">{t.stats.speakersTitle}:</span>{" "}
          {eventStats.speakers.map((s) => `${s.name} (${s.role[lang]})`).join(", ")}.
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
          {t.home.eventCpm(eventStats.linkedinCpm.low, eventStats.linkedinCpm.high)}{" "}
          <a href={linkedin.url} target="_blank" rel="noopener" className="text-blue hover:underline">
            ({linkedin.label})
          </a>
        </p>
        <p className="mt-2 text-[12px] text-ink-3">
          {t.stats.sources}:{" "}
          {eventStats.sources.slice(0, 2).map((s, i) => (
            <span key={s.url}>
              {i > 0 && " · "}
              <a href={s.url} target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-ink">
                {s.label}
              </a>
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}

export function Perks({ lang }: { lang: Lang }) {
  const t = dict(lang).home;
  return (
    <section id="perks" className="mx-auto max-w-5xl px-4 pt-20 sm:px-6" aria-labelledby="perks-title">
      <Eyebrow>{t.perksEyebrow}</Eyebrow>
      <h2 id="perks-title" className={h2}>
        {t.perksTitle}
      </h2>
      <p className="mt-1 text-[15px] text-ink-2">{t.perksLead}</p>
      <ul className="mt-6 space-y-3">
        {t.perks.map((perk) => (
          <li key={perk} className="flex gap-3 rounded-xl border border-line bg-card px-4 py-4 text-[15px]">
            <span className="font-semibold text-blue" aria-hidden="true">
              ✓
            </span>
            {perk}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function About({ lang }: { lang: Lang }) {
  const t = dict(lang);
  return (
    <section id="about" className="mx-auto max-w-5xl px-4 pt-16 sm:px-6">
      <div className="grid gap-6 rounded-xl border border-line bg-card p-6 sm:grid-cols-[72px_1fr] sm:items-center sm:gap-8 sm:p-8">
        <Image src="/avatar.jpg" alt="" width={72} height={72} className="size-18 rounded-full object-cover" />
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight">{t.home.aboutTitle}</h2>
          {t.home.about.map((p) => (
            <p key={p} className="mt-2 text-[17px] leading-relaxed text-ink-2">
              {p}
            </p>
          ))}

          <p className="mt-5 text-[15px] font-semibold">
            {t.home.moreAbout}{" "}
            <a href={site.owner.portfolio} target="_blank" rel="noopener" className="text-blue hover:underline">
              example.com
            </a>{" "}
            ·{" "}
            <a href={site.owner.linkedin} target="_blank" rel="noopener" className="text-blue hover:underline">
              LinkedIn
            </a>{" "}
            ·{" "}
            <a href={site.owner.x} target="_blank" rel="noopener" className="text-blue hover:underline">
              X @yourhandle
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

export function Faq({ lang }: { lang: Lang }) {
  const t = dict(lang);
  return (
    <section id="faq" className="mx-auto max-w-5xl px-4 pt-20 sm:px-6" aria-labelledby="faq-title">
      <Eyebrow>{t.home.faqEyebrow}</Eyebrow>
      <h2 id="faq-title" className={h2}>
        {t.home.faqTitle}
      </h2>
      <div className="mt-6 divide-y divide-line overflow-hidden rounded-xl border border-line bg-card">
        {t.faq.items.map((item, i) => (
          <details key={item.q} className="group" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
              {item.q}
              <svg viewBox="0 0 20 20" className="size-3.5 shrink-0 text-ink-2 transition-transform group-open:rotate-45" aria-hidden="true">
                <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </summary>
            <p className="-mt-1 px-4 pb-4 text-[15px] leading-relaxed text-ink-2">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
