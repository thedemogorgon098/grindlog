"use server";
import { revalidatePath } from "next/cache";
import { db, notes } from "@/db";
import { syncAll, clearPlatform } from "@/lib/sync";
import { getSettings, saveSettings } from "@/lib/settings";
import { getRecs, markRec } from "@/lib/recommend";
import { awardBadges } from "@/lib/stats";

export async function syncNow() {
  const errors = await syncAll();
  revalidatePath("/", "layout");
  return errors;
}

export async function saveProfile(form: { lc: string; cf: string; dailyGoal: number; freezesPerMonth: number }) {
  const prev = getSettings();
  const lc = form.lc.trim() || null, cf = form.cf.trim() || null;
  if (!lc && !cf) return { error: "Add at least one handle (or type demo)." };
  if (prev && prev.lc !== lc) clearPlatform("lc");
  if (prev && prev.cf !== cf) clearPlatform("cf");
  saveSettings({ lc, cf, dailyGoal: Math.max(1, Math.min(50, form.dailyGoal || 3)), freezesPerMonth: Math.max(0, Math.min(10, form.freezesPerMonth ?? 2)) });
  const handlesChanged = !prev || prev.lc !== lc || prev.cf !== cf;
  const errors = handlesChanged ? await syncAll() : (awardBadges(), {});
  revalidatePath("/", "layout");
  return { errors };
}

export async function regenRecs() {
  getRecs(true);
  revalidatePath("/next");
}

export async function toggleRec(problemId: string, done: boolean) {
  markRec(problemId, done);
  revalidatePath("/next");
}

export async function saveNote(problemId: string, v: { text?: string; revisit?: boolean }) {
  const row = { problemId, ...v, updatedAt: Date.now() };
  db.insert(notes).values({ text: "", ...row }).onConflictDoUpdate({ target: notes.problemId, set: row }).run();
  revalidatePath("/problems");
  revalidatePath("/next");
}
