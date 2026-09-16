import type { Lang } from "../spots";
import { en } from "./en";
import { it } from "./it";

export type { Dictionary } from "./en";

export const dictionaries = { en, it };

export function dict(lang: Lang) {
  return dictionaries[lang];
}

export function localePath(lang: Lang, path: string) {
  if (lang === "en") return path;
  return path === "/" ? "/it" : `/it${path}`;
}

export function locale(lang: Lang) {
  return lang === "it" ? "it-IT" : "en-GB";
}

export function parseLang(value: unknown): Lang {
  return value === "it" ? "it" : "en";
}
