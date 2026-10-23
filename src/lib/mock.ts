import { db, problems, progress, activity, snapshots, ratings } from "@/db";
import { kvSet } from "./cache";
import { dayKey, DAY_MS } from "./day";

const TAGS = ["DP", "Greedy", "Graphs", "Math", "Binary Search", "Strings", "Trees", "Implementation", "Data Structures", "Number Theory", "Two Pointers", "Sorting", "Bits", "Constructive", "Combinatorics", "DSU", "Shortest Paths", "Hashing"];
const ADJ = ["Lucky", "Balanced", "Silent", "Broken", "Magic", "Tiny", "Infinite", "Prime", "Hidden", "Twisted", "Lazy", "Golden", "Sneaky", "Mirror", "Frozen"];
const NOUN = ["Array", "Permutation", "Tree", "Grid", "String", "Queries", "Towers", "Coins", "Segments", "Robots", "Garden", "Bridges", "Matrix", "Subsequence", "Game"];

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeds a plausible year of fake history for a platform. Rows are marked with a #demo URL. */
export function seedDemo(p: "cf" | "lc") {
  const r = rng(p === "cf" ? 42 : 7);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const tagsFor = () => [...new Set([pick(TAGS), pick(TAGS), ...(r() < 0.4 ? [pick(TAGS)] : [])])];
  const catalog: (typeof problems.$inferInsert)[] = [];
  for (let i = 0; i < 400; i++) {
    const name = `${pick(ADJ)} ${pick(NOUN)}`;
    if (p === "cf") {
      const idx = "ABCDEF"[Math.floor(r() * 6)], rating = Math.min(3000, 800 + "ABCDEF".indexOf(idx) * 300 + Math.round(r() * 3) * 100);
      catalog.push({ id: `cf:${1700 + i}${idx}`, platform: "cf", title: name, url: "https://codeforces.com/problemset#demo", rating, tags: tagsFor() });
    } else {
      catalog.push({ id: `lc:demo-${i}`, platform: "lc", title: `${3000 + i}. ${name}`, url: "https://leetcode.com/problemset/#demo", difficulty: pick(["Easy", "Medium", "Medium", "Hard"]), tags: tagsFor() });
    }
  }
  const now = Date.now(), perDay = new Map<string, number>(), prog: (typeof progress.$inferInsert)[] = [];
  let ci = 0;
  for (let d = 364; d >= 0 && ci < 300; d--) {
    const streak = d < 12, n = streak ? 1 + Math.floor(r() * 2) : r() < 0.45 ? Math.floor(r() * 3) : 0;
    for (let k = 0; k < n && ci < 300; k++) {
      const at = now - d * DAY_MS - Math.floor(r() * 3) * 3_600_000;
      const solved = r() < 0.88;
      prog.push({ problemId: catalog[ci++].id as string, attempts: 1 + Math.floor(r() * 4), solvedAt: solved ? at : null });
      if (solved) perDay.set(dayKey(at), (perDay.get(dayKey(at)) ?? 0) + 1);
    }
  }
  const solved = prog.filter((x) => x.solvedAt).map((x) => catalog.find((c) => c.id === x.problemId)!);
  db.transaction((tx) => {
    tx.insert(problems).values(catalog).onConflictDoNothing().run();
    for (const x of prog) tx.insert(progress).values(x).onConflictDoNothing().run();
    for (const [day, count] of perDay) tx.insert(activity).values({ day, platform: p, count }).onConflictDoNothing().run();
    let rating = 1150;
    if (p === "cf")
      for (let i = 0; i < 24; i++) {
        rating += Math.round((r() - 0.38) * 90);
        tx.insert(ratings).values({ contestId: 1900 + i, name: `Demo Round #${900 + i}`, at: now - (24 - i) * 14 * DAY_MS, rating }).onConflictDoNothing().run();
      }
    const split = p === "cf"
      ? { easy: solved.filter((c) => c.rating! < 1200).length, medium: solved.filter((c) => c.rating! >= 1200 && c.rating! < 1800).length, hard: solved.filter((c) => c.rating! >= 1800).length }
      : { easy: solved.filter((c) => c.difficulty === "Easy").length, medium: solved.filter((c) => c.difficulty === "Medium").length, hard: solved.filter((c) => c.difficulty === "Hard").length };
    tx.insert(snapshots).values({ day: dayKey(), platform: p, total: solved.length, ...split, rating: p === "cf" ? rating : null }).onConflictDoNothing().run();
    if (p === "lc") {
      const tags: Record<string, number> = {};
      for (const c of solved) for (const t of c.tags ?? []) tags[t] = (tags[t] ?? 0) + 1;
      kvSet("lc:tags", tags);
      kvSet("lc:stats", { All: { count: solved.length, submissions: prog.reduce((a, x) => a + x.attempts!, 0) }, Easy: { count: split.easy }, Medium: { count: split.medium }, Hard: { count: split.hard } });
    }
  });
  kvSet(`demo:${p}`, 1);
}
