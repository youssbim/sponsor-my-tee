"use server";

import { revalidatePath } from "next/cache";
import { isAdmin, logIn, logOut } from "@/lib/admin-auth";
import { site } from "@/lib/config";
import { approveBid, rejectBid, removeSponsor, retryRefunds, setSponsor } from "@/lib/fulfill";
import { announce } from "@/lib/realtime";
import { spotById } from "@/lib/spots";
import { getStore } from "@/lib/store";
import { cleanText, isEmail, LOGO_TYPES, MAX_LOGO_BYTES, normalizeUrl, parseAmount } from "@/lib/validation";

async function guard() {
  if (!(await isAdmin())) throw new Error("Not signed in");
}

export async function loginAction(_prev: string | null, form: FormData) {
  const ok = await logIn(String(form.get("password") ?? ""));
  if (!ok) return "Wrong password.";
  revalidatePath("/adm");
  return null;
}

export async function logoutAction() {
  await logOut();
  revalidatePath("/adm");
}

export async function approveAction(form: FormData) {
  await guard();
  await approveBid(String(form.get("id")));
  revalidatePath("/adm");
}

export async function rejectAction(form: FormData) {
  await guard();
  await rejectBid(String(form.get("id")));
  revalidatePath("/adm");
}

export async function retryRefundsAction(form: FormData) {
  await guard();
  await retryRefunds(String(form.get("spotId")));
  revalidatePath("/adm");
}

export async function toggleBadgeHiddenAction(form: FormData) {
  await guard();
  const store = getStore();
  if (!store) return;
  const id = String(form.get("id"));
  const claim = await store.getBadgeClaim(id);
  if (!claim) return;
  await store.updateBadgeClaim(id, { hidden: !claim.hidden });
  await announce({ type: "review" });
  revalidatePath("/adm");
}

export async function setSponsorAction(_prev: string | null, form: FormData) {
  await guard();
  const spot = spotById.get(String(form.get("spotId")));
  const brand = cleanText(form.get("brand"), 60);
  const amount = parseAmount(form.get("amount"));
  const url = normalizeUrl(cleanText(form.get("url"), 300));
  const email = cleanText(form.get("email"), 200) || site.owner.email;
  const logo = form.get("logo");

  if (!spot) return "Spazio non valido.";
  if (!brand) return "Manca il nome del brand.";
  if (!Number.isFinite(amount) || amount <= 0) return "Inserisci l'importo pagato.";
  if (url === "invalid") return "Il sito non è valido.";
  if (!isEmail(email)) return "Email non valida.";
  if (!(logo instanceof File) || logo.size === 0) return "Carica il logo.";
  if (!LOGO_TYPES[logo.type]) return "Formato logo non supportato (SVG, PNG, JPG, WebP).";
  if (logo.size > MAX_LOGO_BYTES) return "Il logo supera i 4 MB.";

  await setSponsor({ spotId: spot.id, brand, amount, url, email, logo, logoExt: LOGO_TYPES[logo.type] });
  revalidatePath("/adm");
  return "ok";
}

export async function setLogoScaleAction(id: string, scale: number, offsetX = 0, offsetY = 0) {
  await guard();
  const store = getStore();
  if (!store) throw new Error("Store not configured");
  const clamp = (v: number, min: number, max: number, fallback: number) => Math.round(Math.min(max, Math.max(min, Number.isFinite(v) ? v : fallback)));
  await store.updateBid(id, {
    logo_scale: clamp(Number(scale), 25, 400, 100),
    logo_offset_x: clamp(Number(offsetX), -100, 100, 0),
    logo_offset_y: clamp(Number(offsetY), -100, 100, 0),
  });
  await announce({ type: "review" });
  revalidatePath("/adm");
}

export async function setGoalAction(_prev: string | null, form: FormData) {
  await guard();
  const store = getStore();
  if (!store) return "Database non collegato.";
  const goal = Math.round(Number(String(form.get("goal") ?? "").replace(/[^\d]/g, "")));
  if (!Number.isFinite(goal) || goal < 1 || goal > 1_000_000) return "Obiettivo non valido.";
  await store.setGoal(goal);
  await announce({ type: "review" });
  revalidatePath("/adm");
  revalidatePath("/");
  return "ok";
}

export async function removeSponsorAction(id: string) {
  await guard();
  await removeSponsor(id);
  revalidatePath("/adm");
}
