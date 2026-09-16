import "server-only";
import { Resend } from "resend";
import { nextMinimum, site } from "./config";
import { formatMoney } from "./format";
import { spotById, type Lang } from "./spots";
import type { BadgeRow, BidRow } from "./types";

// Emails are optional: without RESEND_API_KEY they are logged and skipped.

let resend: Resend | null = null;

async function send(to: string, subject: string, lines: string[]) {
  const from = process.env.RESEND_FROM;
  if (!process.env.RESEND_API_KEY || !from) {
    console.info(`[email skipped] to=${to} subject="${subject}"`);
    return;
  }
  resend ??= new Resend(process.env.RESEND_API_KEY);
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#1d1d1f;max-width:520px">${lines
    .map((l) => `<p style="margin:0 0 14px">${l}</p>`)
    .join("")}<p style="margin:24px 0 0;color:#6e6e73;font-size:13px">${site.owner.name} · <a href="${site.url}" style="color:#0066cc">${site.url.replace("https://", "")}</a></p></div>`;
  try {
    const { error } = await resend.emails.send({ from, to, subject, html, replyTo: site.owner.email });
    if (error) console.error("[email] failed", error);
  } catch (error) {
    console.error("[email] failed", error);
  }
}

function spotName(bid: BidRow) {
  const spot = spotById.get(bid.spot_id);
  return spot ? `${spot.id} · ${spot.name[bid.lang]}` : bid.spot_id;
}

const eur = (amount: number, lang: Lang) => formatMoney(amount, lang);
const home = (lang: Lang) => (lang === "it" ? `${site.url}/it` : site.url);

export function emailLeading(bid: BidRow) {
  const it = bid.lang === "it";
  return send(
    bid.email,
    it ? `Sei in testa su ${spotName(bid)}` : `You're leading on ${spotName(bid)}`,
    it
      ? [
          `Ciao ${bid.brand},`,
          `pagamento arrivato: con <strong>${eur(bid.amount, "it")}</strong> sei in testa su <strong>${spotName(bid)}</strong>.`,
          `Adesso do un'occhiata al logo. Se qualcuno offre più di te ti avviso subito e ti rimborso tutto sulla carta, senza che tu debba fare niente.`,
          `<a href="${home("it")}#spots">Vedi la maglietta</a>`,
        ]
      : [
          `Hi ${bid.brand},`,
          `your payment came through: your <strong>${eur(bid.amount, "en")}</strong> bid is leading on <strong>${spotName(bid)}</strong>.`,
          `I'll check your logo shortly. If someone outbids you, I'll let you know and refund the full amount to your card automatically.`,
          `<a href="${home("en")}#spots">See the shirt</a>`,
        ],
  );
}

export function emailOutbid(bid: BidRow, newAmount: number) {
  const it = bid.lang === "it";
  return send(
    bid.email,
    it ? `Qualcuno ti ha superato su ${spotName(bid)}` : `You've been outbid on ${spotName(bid)}`,
    it
      ? [
          `Ciao ${bid.brand},`,
          `su ${spotName(bid)} è arrivata un'offerta da <strong>${eur(newAmount, "it")}</strong>. I tuoi ${eur(bid.amount, "it")} sono già stati rimborsati.`,
          `Se lo rivuoi, ti basta offrire almeno ${eur(nextMinimum(newAmount), "it")}.`,
          `<a href="${home("it")}?spot=${bid.spot_id}#spots">Rilancia</a>`,
        ]
      : [
          `Hi ${bid.brand},`,
          `someone bid <strong>${eur(newAmount, "en")}</strong> on ${spotName(bid)}. Your ${eur(bid.amount, "en")} has been refunded in full.`,
          `To take the spot back, bid at least ${eur(nextMinimum(newAmount), "en")}.`,
          `<a href="${home("en")}?spot=${bid.spot_id}#spots">Bid again</a>`,
        ],
  );
}

export function emailLate(bid: BidRow) {
  const it = bid.lang === "it";
  return send(
    bid.email,
    it ? "Qualcuno è arrivato un attimo prima" : "Someone got there first",
    it
      ? [
          `Ciao ${bid.brand},`,
          `mentre pagavi, qualcun altro ha chiuso un'offerta più alta su ${spotName(bid)}. Ti ho già rimborsato ${eur(bid.amount, "it")}.`,
          `<a href="${home("it")}?spot=${bid.spot_id}#spots">Rilancia</a>`,
        ]
      : [
          `Hi ${bid.brand},`,
          `while you were paying, another bidder confirmed a higher bid on ${spotName(bid)}. Your ${eur(bid.amount, "en")} has been refunded in full.`,
          `<a href="${home("en")}?spot=${bid.spot_id}#spots">Bid again</a>`,
        ],
  );
}

export function emailClosed(bid: BidRow) {
  const it = bid.lang === "it";
  return send(
    bid.email,
    it ? "L'asta era già chiusa" : "Bidding had already closed",
    it
      ? [
          `Ciao ${bid.brand},`,
          `il tuo pagamento su ${spotName(bid)} è arrivato dopo la chiusura dell'asta, quindi l'offerta non vale. Ti ho già rimborsato ${eur(bid.amount, "it")}.`,
        ]
      : [
          `Hi ${bid.brand},`,
          `your payment for ${spotName(bid)} came through after bidding closed, so the bid doesn't count. Your ${eur(bid.amount, "en")} has been refunded in full.`,
        ],
  );
}

export function emailRejected(bid: BidRow) {
  const it = bid.lang === "it";
  return send(
    bid.email,
    it ? "Non posso accettare la tua offerta" : "Your bid wasn't accepted",
    it
      ? [
          `Ciao ${bid.brand},`,
          `mi dispiace, ma questo brand non posso metterlo sulla maglietta, quindi ho annullato l'offerta su ${spotName(bid)}. Ti ho rimborsato tutti i ${eur(bid.amount, "it")}.`,
          `Se pensi che ci sia un errore, rispondi pure a questa email.`,
        ]
      : [
          `Hi ${bid.brand},`,
          `I can't put this brand on the shirt, so I've declined your bid on ${spotName(bid)}. Your ${eur(bid.amount, "en")} has been refunded in full.`,
          `If you think this is a mistake, just reply to this email.`,
        ],
  );
}

export function emailAdminNewBid(bid: BidRow) {
  const to = process.env.ADMIN_EMAIL;
  if (!to) return Promise.resolve();
  return send(to, `New bid: ${eur(bid.amount, "en")} on ${spot(bid)} by ${bid.brand}`, [
    `<strong>${bid.brand}</strong> bid ${eur(bid.amount, "en")} on ${spot(bid)}.`,
    `Website: ${bid.url ?? "—"} · X: ${bid.x_handle ? "@" + bid.x_handle : "—"} · Email: ${bid.email}`,
    `<a href="${site.url}/adm#bid-${bid.id}">Review it</a>`,
  ]);
}

function spot(bid: BidRow) {
  const s = spotById.get(bid.spot_id);
  return s ? `${s.id} ${s.name.en}` : bid.spot_id;
}

export function emailBadgeLate(claim: BadgeRow) {
  const it = claim.lang === "it";
  return send(
    claim.email,
    it ? "Il badge è stato preso mentre pagavi" : "The badge was taken while you paid",
    it
      ? [
          `Ciao ${claim.label},`,
          `qualcuno ha preso il badge un attimo prima di te, quindi ti ho rimborsato ${eur(claim.amount, "it")}.`,
          `<a href="${home("it")}">Riprova</a>`,
        ]
      : [
          `Hi ${claim.label},`,
          `someone paid for the badge moments before you did, so your ${eur(claim.amount, "en")} has been refunded.`,
          `<a href="${home("en")}">Try again</a>`,
        ],
  );
}
