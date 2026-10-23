import { db, problems, progress, activity, snapshots, ratings, badges, notes } from "@/db";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { kvGet } from "./cache";
import { addDays, dayKey, dayStart } from "./day";
import { getSettings } from "./settings";
import { TAG_LIST } from "./tags";

export type Row = { id: string; platform: "cf" | "lc"; title: string; url: string; rating: number | null; difficulty: string | null; tags: string[]; attempts: number; solvedAt: number | null; reviewCount: number; lastReviewAt: number | null };

const cols = { id: problems.id, platform: problems.platform, title: problems.title, url: problems.url, rating: problems.rating, difficulty: problems.difficulty, tags: problems.tags };

/** Attempted problems, plus untouched ones that have a note or revisit flag. */
export function progressRows(): Row[] {
  const rows: Row[] = db.select({ ...cols, attempts: progress.attempts, solvedAt: progress.solvedAt, reviewCount: progress.reviewCount, lastReviewAt: progress.lastReviewAt })
    .from(progress).innerJoin(problems, eq(problems.id, progress.problemId)).all();
  const seen = new Set(rows.map((r) => r.id));
  for (const p of db.select(cols).from(notes).innerJoin(problems, eq(problems.id, notes.problemId)).all())
    if (!seen.has(p.id)) rows.push({ ...p, attempts: 0, solvedAt: null, reviewCount: 0, lastReviewAt: null });
  return rows;
}

const latestSnap = (p: string, before?: string) =>
  db.select().from(snapshots).where(before ? and(eq(snapshots.platform, p), lt(snapshots.day, before)) : eq(snapshots.platform, p)).orderBy(desc(snapshots.day)).get();

/** Solves since `from`: CF from deduped progress, LC = max(deduped recent ACs, snapshot delta). */
export function solvesSince(from: string) {
  const rows = db.select({ id: progress.problemId }).from(progress).where(gte(progress.solvedAt, dayStart(from))).all();
  const cf = rows.filter((r) => r.id.startsWith("cf:")).length;
  let lc = rows.length - cf;
  const now = latestSnap("lc"), base = latestSnap("lc", from);
  if (now && base && now.day >= from) lc = Math.max(lc, now.total - base.total);
  return { cf, lc, total: cf + lc };
}

export const totals = () => ({ cf: latestSnap("cf")?.total ?? 0, lc: latestSnap("lc")?.total ?? 0 });

export function activityByDay() {
  const m = new Map<string, number>();
  for (const a of db.select().from(activity).all()) m.set(a.day, (m.get(a.day) ?? 0) + a.count);
  return m;
}

export function heatmap(days = 365) {
  const m = activityByDay(), today = dayKey();
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(today, i - days + 1);
    return { day, count: m.get(day) ?? 0 };
  });
}

export function streak() {
  const m = activityByDay(), per = getSettings()?.freezesPerMonth ?? 2, today = dayKey();
  const used: string[] = [];
  let cur = 0, day = m.get(today) ? today : addDays(today, -1);
  for (let i = 0; i < 3650; i++, day = addDays(day, -1)) {
    if (m.get(day)) { cur++; continue; }
    const month = day.slice(0, 7);
    if (cur > 0 && used.filter((d) => d.startsWith(month)).length < per) { used.push(day); continue; }
    break;
  }
  while (used.length && !m.get(addDays(used[used.length - 1], -1))) used.pop();
  let best = 0, run = 0;
  for (const d of [...m.keys()].filter((d) => m.get(d)).sort()) {
    run = m.get(addDays(d, -1)) ? run + 1 : 1;
    best = Math.max(best, run);
  }
  const month = today.slice(0, 7);
  return { current: cur, best: Math.max(best, cur), frozen: used, freezesLeft: per - used.filter((d) => d.startsWith(month)).length };
}

export function difficulty() {
  const buckets = ["800", "1000", "1200", "1400", "1600", "1800", "2000", "2200+"].map((bucket) => ({ bucket, count: 0 }));
  for (const r of progressRows()) if (r.platform === "cf" && r.solvedAt && r.rating) buckets[Math.min(7, Math.max(0, Math.floor((r.rating - 800) / 200)))].count++;
  const lc = latestSnap("lc");
  return { cf: buckets, lc: lc ? [{ name: "Easy", count: lc.easy }, { name: "Medium", count: lc.medium }, { name: "Hard", count: lc.hard }] : [] };
}

export const ratingHistory = () => db.select().from(ratings).orderBy(ratings.at).all();

export type TagStat = { tag: string; solved: number; cfSolved: number; lcSolved: number; attempts: number; success: number | null; weakness: number };

export function tagStats(): TagStat[] {
  const lcTags = kvGet<Record<string, number>>("lc:tags");
  const s = new Map(TAG_LIST.map((t) => [t, { tag: t, cfSolved: 0, lcSolved: lcTags?.[t] ?? 0, attempts: 0 }]));
  for (const r of progressRows())
    for (const t of r.tags) {
      const e = s.get(t);
      if (!e) continue;
      if (r.platform === "cf") { e.attempts += r.attempts; if (r.solvedAt) e.cfSolved++; }
      else if (!lcTags && r.solvedAt) e.lcSolved++;
    }
  const list = [...s.values()].map((e) => ({ ...e, solved: e.cfSolved + e.lcSolved, success: e.attempts ? e.cfSolved / e.attempts : null }));
  const max = Math.max(1, ...list.map((e) => e.solved));
  const rates = list.filter((e) => e.success != null).map((e) => e.success!);
  const avg = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0.5;
  return list
    .map((e) => ({ ...e, weakness: 0.6 * (1 - Math.sqrt(e.solved / max)) + 0.4 * (1 - (e.success ?? avg)) }))
    .sort((a, b) => b.weakness - a.weakness);
}

export function weeklyReport() {
  const today = dayKey(), from = addDays(today, -6);
  const cur = solvesSince(from), prev = solvesSince(addDays(from, -7)).total - cur.total;
  const tagCount: Record<string, number> = {};
  for (const r of progressRows()) if (r.solvedAt && r.solvedAt >= dayStart(from)) for (const t of r.tags) tagCount[t] = (tagCount[t] ?? 0) + 1;
  const improved = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const hist = ratingHistory();
  const before = [...hist].reverse().find((h) => h.at < dayStart(from))?.rating ?? hist[0]?.rating;
  const ratingDelta = hist.length && before != null ? hist[hist.length - 1].rating - before : 0;
  const act = activityByDay();
  const daily = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(from, i);
    return { day: new Date(dayStart(d)).toLocaleDateString("en", { weekday: "short" }), count: act.get(d) ?? 0 };
  });
  const weakest = tagStats()[0]?.tag;
  const insight =
    cur.total === 0 ? "Quiet week. One easy problem tomorrow restarts the engine."
    : prev > 0 && cur.total >= prev * 1.25 ? `Up ${Math.round((cur.total / prev - 1) * 100)}% on last week. Momentum is real, protect it.`
    : prev > 0 && cur.total < prev * 0.75 ? `Down from ${prev} last week. Shorter sessions beat skipped ones.`
    : weakest && !tagCount[weakest] ? `Zero ${weakest} this week, and it's your weakest tag. Do one tomorrow.`
    : ratingDelta > 0 ? `+${ratingDelta} rating this week. The grind is converting.`
    : `Steady ${cur.total} solves. Push one notch harder next week.`;
  return { from, to: today, solves: cur, prev, improved, ratingDelta, daily, insight, activeDays: daily.filter((d) => d.count).length };
}

export const BADGES = [
  { id: "solve-1", label: "First Blood", emoji: "🩸", color: "var(--pink)" },
  { id: "solve-10", label: "Double Digits", emoji: "🔟", color: "var(--yellow)" },
  { id: "solve-50", label: "Fifty Up", emoji: "🎯", color: "var(--sky)" },
  { id: "solve-100", label: "Century", emoji: "💯", color: "var(--lime)" },
  { id: "solve-250", label: "Quarter K", emoji: "🧱", color: "var(--orange)" },
  { id: "solve-500", label: "Half K", emoji: "🚀", color: "var(--violet)" },
  { id: "solve-1000", label: "The Grand", emoji: "👑", color: "var(--yellow)" },
  { id: "streak-7", label: "Week Warrior", emoji: "🔥", color: "var(--orange)" },
  { id: "streak-30", label: "Monthly Menace", emoji: "🌋", color: "var(--pink)" },
  { id: "streak-100", label: "Unbreakable", emoji: "💎", color: "var(--sky)" },
  { id: "rating-1200", label: "Pupil+", emoji: "🌱", color: "var(--lime)" },
  { id: "rating-1400", label: "Specialist", emoji: "🧪", color: "var(--sky)" },
  { id: "rating-1600", label: "Expert", emoji: "🧠", color: "var(--violet)" },
  { id: "rating-1900", label: "Candidate Master", emoji: "⚡", color: "var(--pink)" },
  { id: "goal-7", label: "Goal Getter", emoji: "🏁", color: "var(--lime)" },
];

export function awardBadges() {
  const t = totals(), total = t.cf + t.lc, best = streak().best, goal = getSettings()?.dailyGoal ?? 3;
  const maxRating = Math.max(0, ...ratingHistory().map((r) => r.rating));
  const goalDays = [...activityByDay().values()].filter((c) => c >= goal).length;
  const value = { solve: total, streak: best, rating: maxRating, goal: goalDays } as Record<string, number>;
  const now = Date.now();
  for (const b of BADGES) {
    const [k, n] = b.id.split("-");
    if (value[k] >= Number(n)) db.insert(badges).values({ id: b.id, earnedAt: now }).onConflictDoNothing().run();
  }
}

export const earnedBadges = () => new Map(db.select().from(badges).all().map((b) => [b.id, b.earnedAt]));

export const recentSolves = (n = 8) => progressRows().filter((r) => r.solvedAt).sort((a, b) => b.solvedAt! - a.solvedAt!).slice(0, n);

export const lcStats = () => kvGet<Record<string, { count: number; submissions?: number }>>("lc:stats");

export const isDemo = () => ({ cf: !!kvGet("demo:cf"), lc: !!kvGet("demo:lc") });
