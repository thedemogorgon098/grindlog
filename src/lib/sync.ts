import { db, problems, progress, activity, snapshots, ratings } from "@/db";
import { and, eq, like, sql } from "drizzle-orm";
import { cf, cfId, cfUrl } from "./cf";
import { lc, lcUrl } from "./lc";
import { kvGet, kvSet, kvDel } from "./cache";
import { normTags } from "./tags";
import { dayKey } from "./day";
import { getSettings, saveSettings } from "./settings";
import { seedDemo } from "./mock";
import { awardBadges } from "./stats";

type P = "cf" | "lc";
type ProblemRow = typeof problems.$inferInsert;

function upsertProblems(rows: ProblemRow[]) {
  db.transaction((tx) => {
    for (let i = 0; i < rows.length; i += 400)
      tx.insert(problems).values(rows.slice(i, i + 400)).onConflictDoUpdate({
        target: problems.id,
        set: { title: sql`excluded.title`, url: sql`excluded.url`, difficulty: sql`excluded.difficulty`, rating: sql`excluded.rating`, tags: sql`excluded.tags`, paid: sql`excluded.paid` },
      }).run();
  });
}

export function clearPlatform(p: P) {
  db.transaction((tx) => {
    tx.delete(progress).where(like(progress.problemId, `${p}:%`)).run();
    tx.delete(activity).where(eq(activity.platform, p)).run();
    tx.delete(snapshots).where(eq(snapshots.platform, p)).run();
    if (p === "cf") tx.delete(ratings).run();
    if (kvGet(`demo:${p}`)) tx.delete(problems).where(and(eq(problems.platform, p), like(problems.url, "%#demo"))).run();
  });
  kvDel(`demo:${p}`);
  kvDel(`fresh:${p}-catalog`);
  if (p === "lc") kvDel("lc:tags"), kvDel("lc:stats");
}

function setActivity(p: P, perDay: Map<string, number>) {
  db.transaction((tx) => {
    tx.delete(activity).where(eq(activity.platform, p)).run();
    const rows = [...perDay].map(([day, count]) => ({ day, platform: p, count }));
    for (let i = 0; i < rows.length; i += 400) tx.insert(activity).values(rows.slice(i, i + 400)).run();
  });
}

function snapshot(p: P, v: Omit<typeof snapshots.$inferInsert, "day" | "platform">) {
  const row = { day: dayKey(), platform: p, ...v };
  db.insert(snapshots).values(row).onConflictDoUpdate({ target: [snapshots.day, snapshots.platform], set: v }).run();
}

async function syncCf(handle: string) {
  const [info, subs, hist] = await Promise.all([cf.info(handle), cf.status(handle), cf.rating(handle)]);
  if (kvGet("demo:cf")) clearPlatform("cf");
  if (!kvGet("fresh:cf-catalog")) {
    const all = await cf.problems();
    upsertProblems(all.filter((p) => p.contestId).map((p) => ({ id: cfId(p), platform: "cf", title: p.name, url: cfUrl(p), rating: p.rating ?? null, tags: normTags(p.tags) })));
    kvSet("fresh:cf-catalog", 1, 86_400_000);
  }
  const byProblem = new Map<string, { attempts: number; solvedAt: number | null; p: (typeof subs)[number]["problem"] }>();
  for (const s of subs) {
    if (!s.problem.contestId || s.problem.contestId >= 100000) continue;
    const id = cfId(s.problem);
    const e = byProblem.get(id) ?? { attempts: 0, solvedAt: null, p: s.problem };
    e.attempts++;
    if (s.verdict === "OK") e.solvedAt = Math.min(e.solvedAt ?? Infinity, s.creationTimeSeconds * 1000);
    byProblem.set(id, e);
  }
  upsertProblems([...byProblem].map(([id, { p }]) => ({ id, platform: "cf" as const, title: p.name, url: cfUrl(p), rating: p.rating ?? null, tags: normTags(p.tags) })));
  db.transaction((tx) => {
    for (const [problemId, e] of byProblem)
      tx.insert(progress).values({ problemId, attempts: e.attempts, solvedAt: e.solvedAt })
        .onConflictDoUpdate({ target: progress.problemId, set: { attempts: e.attempts, solvedAt: e.solvedAt } }).run();
    tx.delete(ratings).run();
    for (const r of hist) tx.insert(ratings).values({ contestId: r.contestId, name: r.contestName, at: r.ratingUpdateTimeSeconds * 1000, rating: r.newRating }).run();
  });
  const perDay = new Map<string, number>();
  let easy = 0, medium = 0, hard = 0;
  for (const e of byProblem.values()) {
    if (!e.solvedAt) continue;
    const d = dayKey(e.solvedAt);
    perDay.set(d, (perDay.get(d) ?? 0) + 1);
    const r = e.p.rating ?? 0;
    r >= 1800 ? hard++ : r >= 1200 ? medium++ : easy++;
  }
  setActivity("cf", perDay);
  snapshot("cf", { total: easy + medium + hard, easy, medium, hard, rating: info.rating ?? null });
}

async function syncLc(handle: string) {
  const prof = await lc.profile(handle);
  if (kvGet("demo:lc")) clearPlatform("lc");
  if (!kvGet("fresh:lc-catalog")) {
    try {
      const all = await lc.problems();
      upsertProblems(all.map((q) => ({ id: `lc:${q.titleSlug}`, platform: "lc", title: `${q.questionFrontendId}. ${q.title}`, url: lcUrl(q.titleSlug), difficulty: q.difficulty, tags: normTags(q.topicTags.map((t) => t.name)), paid: q.isPaidOnly })));
      kvSet("fresh:lc-catalog", 1, 86_400_000);
    } catch (e) {
      console.warn("[grindlog] LC catalog unavailable:", (e as Error).message);
    }
  }
  db.transaction((tx) => {
    for (const r of prof.recent) {
      const problemId = `lc:${r.titleSlug}`, at = Number(r.timestamp) * 1000;
      tx.insert(problems).values({ id: problemId, platform: "lc", title: r.title, url: lcUrl(r.titleSlug) }).onConflictDoNothing().run();
      tx.insert(progress).values({ problemId, attempts: 1, solvedAt: at }).onConflictDoUpdate({
        target: progress.problemId,
        set: { solvedAt: sql`min(coalesce(${progress.solvedAt}, ${at}), ${at})`, attempts: sql`max(${progress.attempts}, 1)` },
      }).run();
    }
  });
  const perDay = new Map<string, number>();
  for (const [ts, n] of Object.entries(prof.calendar)) {
    const d = dayKey(Number(ts) * 1000);
    perDay.set(d, (perDay.get(d) ?? 0) + n);
  }
  setActivity("lc", perDay);
  const tags: Record<string, number> = {};
  for (const t of [...prof.tagProblemCounts.advanced, ...prof.tagProblemCounts.intermediate, ...prof.tagProblemCounts.fundamental])
    for (const n of normTags([t.tagName])) tags[n] = Math.max(tags[n] ?? 0, t.problemsSolved);
  kvSet("lc:tags", tags);
  const ac = Object.fromEntries(prof.submitStats.acSubmissionNum.map((a) => [a.difficulty, a]));
  kvSet("lc:stats", ac);
  snapshot("lc", { total: ac.All?.count ?? 0, easy: ac.Easy?.count ?? 0, medium: ac.Medium?.count ?? 0, hard: ac.Hard?.count ?? 0 });
}

let running: Promise<Record<string, string>> | null = null;

/** Syncs both platforms; falls back to demo data for a platform with no real data. Returns per-platform errors. */
export function syncAll() {
  return (running ??= (async () => {
    const s = getSettings();
    const errors: Record<string, string> = {};
    const jobs: [P, string | null | undefined, (h: string) => Promise<void>][] = [["cf", s?.cf, syncCf], ["lc", s?.lc, syncLc]];
    for (const [p, handle, fn] of jobs) {
      if (!handle) continue;
      try {
        if (handle.toLowerCase() === "demo") throw new Error("demo handle");
        await fn(handle);
      } catch (e) {
        errors[p] = (e as Error).message;
        console.warn(`[grindlog] ${p} sync failed:`, errors[p]);
        const hasReal = !kvGet(`demo:${p}`) && db.select().from(snapshots).where(eq(snapshots.platform, p)).get();
        if (!hasReal && !kvGet(`demo:${p}`)) seedDemo(p);
      }
    }
    saveSettings({ lastSync: Date.now() });
    awardBadges();
    return errors;
  })().finally(() => (running = null)));
}
