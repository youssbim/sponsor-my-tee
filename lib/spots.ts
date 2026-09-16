export type Side = "front" | "back";
export type Lang = "en" | "it";

type Localized = Record<Lang, string>;

export type Spot = {
  id: string;
  side: Side;
  /** Print size in centimetres. */
  w: number;
  h: number;
  /** Opening bid in euros. */
  min: number;
  opensAt?: string;
  name: Localized;
  seen: Localized;
};

export const spots: Spot[] = [
  {
    id: "F1",
    side: "front",
    w: 9,
    h: 9,
    min: 75,
    name: { en: "Left chest", it: "Petto sinistro" },
    seen: {
      en: "Over the heart. In every handshake, badge scan and selfie.",
      it: "Sopra il cuore. C'è in ogni stretta di mano, scansione del badge e selfie.",
    },
  },
  {
    id: "F2",
    side: "front",
    w: 9,
    h: 9,
    min: 60,
    name: { en: "Right chest", it: "Petto destro" },
    seen: {
      en: "Opposite the heart. Same eye line, same photos.",
      it: "Dall'altra parte, alla stessa altezza. Finisce nelle stesse foto.",
    },
  },
  {
    id: "F3",
    side: "front",
    w: 24,
    h: 12,
    min: 150,
    name: { en: "Centre chest", it: "Centro petto" },
    seen: {
      en: "The big one on the front. The first thing you read when I walk up to you.",
      it: "Il più grande davanti. La prima cosa che leggi quando ti vengo incontro.",
    },
  },
  {
    id: "F4",
    side: "front",
    w: 6,
    h: 6,
    min: 25,
    name: { en: "Small square 1", it: "Quadratino 1" },
    seen: {
      en: "A small square under the big one, on the right. Cheap, and still in every photo.",
      it: "Piccolo, sotto il centro petto, a destra. Costa poco e in foto c'è sempre.",
    },
  },
  {
    id: "F5",
    side: "front",
    w: 6,
    h: 6,
    min: 25,
    name: { en: "Small square 2", it: "Quadratino 2" },
    seen: {
      en: "A small square under the big one, in the middle. Cheap, and still in every photo.",
      it: "Piccolo, sotto il centro petto, in mezzo. Costa poco e in foto c'è sempre.",
    },
  },
  {
    id: "F6",
    side: "front",
    w: 6,
    h: 6,
    min: 25,
    name: { en: "Small square 3", it: "Quadratino 3" },
    seen: {
      en: "A small square under the big one, on the left. Cheap, and still in every photo.",
      it: "Piccolo, sotto il centro petto, a sinistra. Costa poco e in foto c'è sempre.",
    },
  },
  {
    id: "S1",
    side: "front",
    w: 9,
    h: 6,
    min: 40,
    name: { en: "Left sleeve", it: "Manica sinistra" },
    seen: {
      en: "Moves every time I point at a slide or shake a hand.",
      it: "Si muove ogni volta che indico una slide o stringo una mano.",
    },
  },
  {
    id: "S2",
    side: "front",
    w: 9,
    h: 6,
    min: 40,
    name: { en: "Right sleeve", it: "Manica destra" },
    seen: {
      en: "The arm that holds the coffee. Always in frame.",
      it: "Il braccio del caffè. Sempre nell'inquadratura.",
    },
  },
  {
    id: "B1",
    side: "back",
    w: 28,
    h: 7,
    min: 90,
    name: { en: "Shoulder banner", it: "Fascia sulle spalle" },
    seen: {
      en: "Sits above the crowd. Readable from ten rows back.",
      it: "Sta sopra le teste. Si legge anche da dieci file più indietro.",
    },
  },
  {
    id: "B2",
    side: "back",
    w: 24,
    h: 24,
    min: 150,
    name: { en: "Centre back", it: "Centro schiena" },
    seen: {
      en: "The whole row behind me looks at it for an entire keynote.",
      it: "Chi mi sta seduto dietro se lo guarda per tutto il keynote.",
    },
  },
  {
    id: "B3",
    side: "back",
    w: 13,
    h: 6,
    min: 25,
    name: { en: "Lower back left", it: "Fascia bassa sinistra" },
    seen: {
      en: "The last thing you see as I head to the next stage.",
      it: "L'ultima cosa che vedi mentre vado verso il palco successivo.",
    },
  },
  {
    id: "B4",
    side: "back",
    w: 13,
    h: 6,
    min: 25,
    name: { en: "Lower back right", it: "Fascia bassa destra" },
    seen: {
      en: "Right next to its twin, on the way out of every talk.",
      it: "Accanto alla sua gemella, ogni volta che esco da un talk.",
    },
  },
];

export const spotById = new Map(spots.map((s) => [s.id, s]));

export function isSpotOpen(spot: Spot, now = Date.now()) {
  return !spot.opensAt || now >= Date.parse(spot.opensAt);
}
