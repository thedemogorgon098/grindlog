import { db, problems, progress, recs, notes, ratings } from "@/db";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { dayKey, DAY_MS } from "./day";
import { getSettings } from "./settings";
import { progressRows, lcStats, tagStats } from "./stats";

const INTERVALS = [3, 7, 14, 30, 60, 120];

function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

export function cfLevel() {
  const last = db.select().from(ratings).orderBy(desc(ratings.at)).get();
  const recent = progressRows().filter((r) => r.platform === "cf" && r.solvedAt && r.rating).sort((a, b) => b.solvedAt! - a.solvedAt!).slice(0, 20);
  const avg = recent.length ? recent.reduce((a, r) => a + r.rating!, 0) / recent.length : 0;
  return Math.round(Math.max(last?.rating ?? 0, avg, 800) / 100) * 100;
}

type Rec = typeof recs.$inferInsert;

function generate(day: string, today: Set<string>, pastNew: Set<string>, count: number): Rec[] {
  const s = getSettings();
  const rows = progressRows();
  const solved = new Set(rows.filter((r) => r.solvedAt).map((r) => r.id));
  const tags = tagStats();
  const weak = new Map(tags.map((t) => [t.tag, t]));
  const top = new Set(tags.slice(0, 5).map((t) => t.tag));
  const out: Rec[] = [];

  // Revisits: flagged problems, or hard-won solves due under spaced repetition.
  const flagged = new Set(db.select().from(notes).where(eq(notes.revisit, true)).all().map((n) => n.problemId));
  const now = Date.now();
  const revisits = rows
    .filter((r) => !today.has(r.id) && (flagged.has(r.id) || (r.solvedAt && r.attempts >= 3 && now - r.solvedAt < 365 * DAY_MS)))
    .map((r) => {
      const since = (now - (r.lastReviewAt ?? r.solvedAt ?? now)) / DAY_MS;
      const due = since / INTERVALS[Math.min(r.reviewCount, INTERVALS.length - 1)];
      return { r, due: flagged.has(r.id) ? Math.max(due, 1.5) : due, since };
    })
    .filter((x) => x.due >= 1)
    .sort((a, b) => b.due - a.due)
    .slice(0, count >= 5 ? 2 : 1);
  for (const { r, due, since } of revisits)
    out.push({
      day, problemId: r.id, kind: "revisit", score: 1 + due,
      why: flagged.has(r.id) ? "You flagged this to revisit. Today's the day." : `Spaced repetition: took ${r.attempts} tries, last seen ${Math.round(since)}d ago. Can you do it clean now?`,
    });

  // New problems: weak tags x difficulty fit.
  const level = cfLevel(), target = level + 150;
  const lc = lcStats();
  const lcHardReady = (lc?.Medium?.count ?? 0) >= 80;
  const platforms = [s?.cf && "cf", s?.lc && "lc"].filter(Boolean) as ("cf" | "lc")[];
  const pool = db.select().from(problems).where(and(inArray(problems.platform, platforms.length ? platforms : ["cf"]), eq(problems.paid, false), sql`json_array_length(${problems.tags}) > 0`)).all();
  const scored = pool
    .filter((p) => !solved.has(p.id) && !today.has(p.id) && !pastNew.has(p.id))
    .flatMap((p) => {
      let fit: number, diffWhy: string;
      if (p.platform === "cf") {
        if (!p.rating || p.rating < level + 100 || p.rating > level + 200) return [];
        fit = 1 - Math.abs(p.rating - target) / 200;
        diffWhy = `${p.rating} = your level +${p.rating - level}`;
      } else {
        if (p.difficulty === "Easy") return [];
        fit = p.difficulty === "Hard" ? (lcHardReady ? 0.9 : 0.4) : lcHardReady ? 0.8 : 1;
        diffWhy = `${p.difficulty} stretch`;
      }
      const tw = p.tags.map((t) => weak.get(t)).filter(Boolean).sort((a, b) => b!.weakness - a!.weakness);
      const best = tw[0];
      if (!best) return [];
      const score = best.weakness * 1.2 + fit * 0.6 + (top.has(best.tag) ? 0.3 : 0) + hash(day + p.id) * 0.35;
      const tagWhy = best.success != null ? `weak spot ${best.tag} (${Math.round(best.success * 100)}% acc, ${best.solved} solved)` : `weak spot ${best.tag} (${best.solved} solved)`;
      return [{ p, score, why: `Hits your ${tagWhy}; ${diffWhy}.`, tag: best.tag }];
    })
    .sort((a, b) => b.score - a.score);

  const usedTags = new Map<string, number>();
  const perPlatform = { cf: 0, lc: 0 };
  const need = count - out.length, share = Math.ceil(need / Math.max(1, platforms.length));
  for (const c of scored) {
    if (out.length >= count) break;
    if ((usedTags.get(c.tag) ?? 0) >= 2 || (platforms.length > 1 && perPlatform[c.p.platform] >= share)) continue;
    usedTags.set(c.tag, (usedTags.get(c.tag) ?? 0) + 1);
    perPlatform[c.p.platform]++;
    out.push({ day, problemId: c.p.id, kind: "new", score: c.score, why: c.why });
  }
  for (const c of scored) {
    if (out.length >= count) break;
    if (!out.some((o) => o.problemId === c.p.id)) out.push({ day, problemId: c.p.id, kind: "new", score: c.score, why: c.why });
  }
  return out;
}

export function getRecs(regenerate = false) {
  const day = dayKey();
  let existing = db.select().from(recs).where(eq(recs.day, day)).all();
  const dropped = regenerate ? existing.filter((r) => !r.done).map((r) => r.problemId) : [];
  if (regenerate) {
    db.delete(recs).where(and(eq(recs.day, day), eq(recs.done, false))).run();
    existing = existing.filter((r) => r.done);
  }
  if (existing.length < 5) {
    const all = db.select().from(recs).all();
    const today = new Set([...dropped, ...all.filter((r) => r.day === day).map((r) => r.problemId)]);
    const pastNew = new Set(all.filter((r) => r.kind === "new").map((r) => r.problemId));
    const fresh = generate(day, today, pastNew, 5 - existing.length);
    if (fresh.length) db.insert(recs).values(fresh).onConflictDoNothing().run();
  }
  return db
    .select({ day: recs.day, problemId: recs.problemId, why: recs.why, kind: recs.kind, done: recs.done, score: recs.score, title: problems.title, url: problems.url, platform: problems.platform, rating: problems.rating, difficulty: problems.difficulty, tags: problems.tags })
    .from(recs).innerJoin(problems, eq(problems.id, recs.problemId))
    .where(eq(recs.day, day)).orderBy(desc(recs.kind), desc(recs.score)).all();
}

export function markRec(problemId: string, done: boolean) {
  const day = dayKey();
  const rec = db.select().from(recs).where(and(eq(recs.day, day), eq(recs.problemId, problemId))).get();
  if (!rec) return;
  db.update(recs).set({ done }).where(and(eq(recs.day, day), eq(recs.problemId, problemId))).run();
  if (rec.kind === "revisit" && done && !rec.done) {
    db.update(progress).set({ reviewCount: sql`${progress.reviewCount} + 1`, lastReviewAt: Date.now() }).where(eq(progress.problemId, problemId)).run();
    db.update(notes).set({ revisit: false }).where(eq(notes.problemId, problemId)).run();
  }
}
