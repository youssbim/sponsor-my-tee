import Link from "next/link";
import { site } from "@/lib/config";
import { dict, localePath } from "@/lib/i18n";
import type { Lang } from "@/lib/spots";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

type Doc = { title: string; updated: string; sections: { h: string; p: string[] }[] };

const email = site.owner.email;

export const terms: Record<Lang, Doc> = {
  en: {
    title: "Terms",
    updated: "Last updated 14 September 2026",
    sections: [
      {
        h: "Who runs this",
        p: [`Sponsor My Tee is run by ${site.owner.name} ("I"). Contact: ${email}.`],
      },
      {
        h: "What you are bidding on",
        p: [
          "Each spot is the right to have one logo printed at the stated size and position on a single white T-shirt that I will wear at Your Conference in Your City, 7–9 October 2026, and to have that logo shown with a link on this website.",
          "Sizes and positions are approximate. Fabric moves and stretches; I place every print as close to the drawing as I reasonably can.",
        ],
      },
      {
        h: "Payment and refunds",
        p: [
          "You pay the full amount of your bid when you place it, and a bid only counts once that payment is confirmed. If a higher bid is confirmed on the same spot, or if I decline your brand, the full amount is refunded to the original payment method.",
          "Bank processing times for refunds are outside my control and usually take 5–10 business days.",
        ],
      },
      {
        h: "Winning",
        p: [
          "Bidding closes on 1 October 2026 at 20:00 Rome time. The highest confirmed and approved bid on each spot wins. Winners have already paid in full and owe nothing more.",
          "Once bidding has closed, a winning bid is not refundable, except as described under \"What isn't promised\".",
        ],
      },
      {
        h: "The badge",
        p: [
          "The badge at the top of the page is a one-time payment. It stays up until someone pays more. It is not refunded when someone replaces you; it is refunded only if another payment for the badge was confirmed before yours.",
        ],
      },
      {
        h: "Your logo",
        p: [
          "You confirm you have the right to use the logo, name and link you submit, and you allow me to print them on the shirt and show them on this site and in photos and posts about the event.",
          "I can refuse or remove any brand at my discretion — for example gambling, adult content, hate, scams, or anything unlawful — and I refund the full amount when I do.",
        ],
      },
      {
        h: "What isn't promised",
        p: [
          "There are no guaranteed impressions, clicks, sales or audience figures. If I can't attend the event for reasons outside my control, I refund every amount paid for spots.",
          "This is an independent project, not affiliated with Your Conference, Your Conference or the venue.",
        ],
      },
    ],
  },
  it: {
    title: "Termini",
    updated: "Ultimo aggiornamento 14 settembre 2026",
    sections: [
      {
        h: "Chi c'è dietro",
        p: [`Sponsor My Tee è un progetto di ${site.owner.name}. Per qualsiasi cosa: ${email}.`],
      },
      {
        h: "Cosa compri con un'offerta",
        p: [
          "Ogni spazio ti dà il diritto di far stampare un logo, nella misura e nella posizione indicate, sulla maglietta bianca che indosserò a Your Conference, a Your City dal 7 al 9 ottobre 2026, e di averlo su questo sito con il tuo link.",
          "Misure e posizioni sono indicative: il tessuto si muove e si allunga, ma ogni stampa la metto il più vicino possibile a come la vedi disegnata.",
        ],
      },
      {
        h: "Pagamento e rimborsi",
        p: [
          "L'offerta si paga per intero nel momento in cui la fai, e vale solo quando il pagamento è confermato. Se sullo stesso spazio arriva un'offerta più alta, o se decido di non accettare il tuo brand, ti rimborso l'intero importo sul metodo di pagamento che hai usato.",
          "I tempi con cui il rimborso compare sul conto dipendono dalla banca, di solito 5–10 giorni lavorativi.",
        ],
      },
      {
        h: "Chi vince",
        p: [
          "L'asta chiude il 1° ottobre 2026 alle 20:00, ora di Roma. Su ogni spazio vince l'offerta più alta, pagata e approvata. Chi vince ha già pagato tutto e non deve altro.",
          "Dopo la chiusura dell'asta l'offerta vincente non è rimborsabile, salvo quanto scritto in \"Cosa non posso garantire\".",
        ],
      },
      {
        h: "Il badge",
        p: [
          "Il badge in cima alla pagina si paga una volta sola e resta lì finché qualcuno non paga di più. Se qualcuno te lo prende non ti rimborso; ti rimborso solo se un altro pagamento per il badge è stato confermato prima del tuo.",
        ],
      },
      {
        h: "Il tuo logo",
        p: [
          "Mi confermi che puoi usare il logo, il nome e il link che mi mandi, e mi autorizzi a stamparli sulla maglietta e a mostrarli su questo sito e in foto e post sull'evento.",
          "Posso rifiutare o togliere qualsiasi brand, per esempio scommesse, contenuti per adulti, odio, truffe o qualunque cosa illegale. In quel caso ti rimborso tutto.",
        ],
      },
      {
        h: "Cosa non posso garantire",
        p: [
          "Non garantisco visualizzazioni, clic, vendite o numeri di pubblico. Se per cause che non dipendono da me non riesco ad andare all'evento, rimborso tutto quello che è stato pagato per gli spazi.",
          "È un progetto indipendente, senza legami con Your Conference, Your Conference o le il tuo spazio eventi.",
        ],
      },
    ],
  },
};

export const privacy: Record<Lang, Doc> = {
  en: {
    title: "Privacy",
    updated: "Last updated 14 September 2026",
    sections: [
      {
        h: "What I collect",
        p: [
          "When you bid or take the badge: brand or display name, email, optional website and X handle, your logo, and the amount. Payments are handled by Stripe — I never see your card details.",
          "A random ID is stored in a cookie so this browser can show you your own bids. Page views are counted without cookies; for each visit I keep only the country (worked out by Vercel from the IP, which I don't store) and the time, shown anonymously on the site.",
        ],
      },
      {
        h: "Why",
        p: [
          "To run the auction: confirm payments, issue refunds, contact you about your logo if needed, print it and show it on this site. Brand names, logos, links and bid amounts are public by design.",
        ],
      },
      {
        h: "Who processes it",
        p: [
          "Stripe (payments), Supabase (database and logo storage, EU), Vercel (hosting and cookieless analytics).",
        ],
      },
      {
        h: "How long",
        p: [
          "Bid records are kept for as long as tax and accounting rules require. Email me at any time to access or delete your personal data that isn't required for those records.",
        ],
      },
      {
        h: "Contact",
        p: [`${site.owner.name} — ${email}`],
      },
    ],
  },
  it: {
    title: "Privacy",
    updated: "Ultimo aggiornamento 14 settembre 2026",
    sections: [
      {
        h: "Quali dati raccolgo",
        p: [
          "Quando fai un'offerta o prendi il badge: il nome del brand o quello che vuoi mostrare, l'email, sito e profilo X se li inserisci, il logo e l'importo. I pagamenti passano da Stripe: i dati della tua carta non li vedo mai.",
          "Salvo un ID casuale in un cookie, così questo browser può mostrarti le tue offerte. Le visite le conto senza cookie: di ogni visita tengo solo il paese (ricavato da Vercel dall'IP, che non salvo) e l'orario, mostrati in forma anonima sul sito.",
        ],
      },
      {
        h: "A cosa mi servono",
        p: [
          "A far funzionare l'asta: confermare i pagamenti, fare i rimborsi, contattarti per il logo se serve, stamparlo e mostrarlo sul sito. Nomi dei brand, loghi, link e importi delle offerte sono pubblici, è il bello del gioco.",
        ],
      },
      {
        h: "Chi li gestisce",
        p: ["Stripe (pagamenti), Supabase (database e archivio dei loghi, in UE), Vercel (hosting e statistiche senza cookie)."],
      },
      {
        h: "Per quanto li tengo",
        p: [
          "I dati delle offerte li conservo per il tempo richiesto dalle norme fiscali e contabili. Puoi scrivermi quando vuoi per vedere o cancellare i tuoi dati personali che non servono a quegli obblighi.",
        ],
      },
      {
        h: "Contatti",
        p: [`${site.owner.name} — ${email}`],
      },
    ],
  },
};

export function LegalPage({ lang, doc }: { lang: Lang; doc: Doc }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 pt-12 sm:px-6">
        <Link href={localePath(lang, "/")} className="text-[14px] text-blue hover:underline">
          ← {dict(lang).leaderboard.back}
        </Link>
        <h1 className="mt-4 text-[40px] font-semibold tracking-[-0.03em]">{doc.title}</h1>
        <p className="mt-1 text-[13px] text-ink-3">{doc.updated}</p>
        <div className="mt-8 grid gap-8">
          {doc.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-[18px] font-semibold tracking-tight">{s.h}</h2>
              {s.p.map((p) => (
                <p key={p} className="mt-2 text-[15px] leading-relaxed text-ink-2">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
