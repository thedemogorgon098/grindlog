import Link from "next/link";
import { requireSettings } from "@/lib/guard";
import { dayKey } from "@/lib/day";
import { BADGES, difficulty, earnedBadges, heatmap, isDemo, ratingHistory, recentSolves, solvesSince, streak, totals } from "@/lib/stats";
import Heatmap from "@/components/Heatmap";
import { Bars, RatingChart } from "@/components/Charts";
import SyncButton from "@/components/SyncButton";
import GoalConfetti from "@/components/GoalConfetti";
import Sticker from "@/components/Sticker";

export default function Dashboard() {
  const s = requireSettings();
  const today = solvesSince(dayKey()), st = streak(), tot = totals(), diff = difficulty(), hist = ratingHistory(), demo = isDemo();
  const earned = earnedBadges();
  const pct = Math.min(100, Math.round((today.total / s.dailyGoal) * 100));
  const hit = today.total >= s.dailyGoal;
  const rating = hist.at(-1)?.rating;

  return (
    <div className="grid gap-5">
      <GoalConfetti hit={hit} day={dayKey()} />
      {(demo.cf || demo.lc) && (
        <div className="brut flex flex-wrap items-center gap-2 !bg-yellow px-4 py-2 text-sm font-bold text-noir">
          ⚠ Showing demo data for {[demo.cf && "Codeforces", demo.lc && "LeetCode"].filter(Boolean).join(" + ")} (API unreachable or handle is “demo”). Sync again later or fix handles in <Link className="underline" href="/settings">Settings</Link>.
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-muted">{new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="h-title text-4xl sm:text-5xl">{hit ? "Goal crushed." : today.total ? "Keep going." : "Let's grind."}</h1>
        </div>
        <SyncButton lastSync={s.lastSync} />
      </div>

      <section className="grid gap-5 md:grid-cols-3">
        <div className={`brut relative p-5 md:col-span-2 ${hit ? "!bg-lime text-noir" : ""}`}>
          <div className="flex items-start justify-between">
            <h2 className="font-bold uppercase tracking-wider">Today</h2>
            <span className="chip bg-card text-ink">goal {s.dailyGoal}</span>
          </div>
          <div className="mt-1 flex items-end gap-3">
            <span className="h-title font-mono text-7xl leading-none">{today.total}</span>
            <span className="mb-2 font-mono text-2xl opacity-60">/ {s.dailyGoal}</span>
          </div>
          <div className="mt-4 h-6 overflow-hidden rounded-lg border-[3px] border-ink bg-paper">
            <div className="h-full border-r-[3px] border-ink bg-pink transition-all" style={{ width: `${pct}%`, borderRightWidth: pct ? 3 : 0 }} />
          </div>
          <div className="mt-3 flex gap-2 text-sm font-bold">
            {s.cf && <span className="chip bg-sky">CF +{today.cf}</span>}
            {s.lc && <span className="chip bg-orange">LC +{today.lc}</span>}
          </div>
        </div>
        <div className="brut relative overflow-hidden !bg-orange p-5 text-noir">
          <h2 className="font-bold uppercase tracking-wider">Streak</h2>
          <div className="flex items-end gap-2">
            <span className="h-title font-mono text-7xl leading-none">{st.current}</span>
            <span className="mb-2 font-bold">day{st.current === 1 ? "" : "s"}</span>
          </div>
          <p className="mt-2 font-mono text-sm">best {st.best} · {"🧊".repeat(Math.max(0, st.freezesLeft))}{st.freezesLeft <= 0 ? "no freezes left" : ` ${st.freezesLeft} freeze${st.freezesLeft > 1 ? "s" : ""} left`}</p>
          {st.frozen.length > 0 && <p className="font-mono text-xs opacity-75">frozen: {st.frozen.join(", ")}</p>}
          <span className="absolute -bottom-6 -right-3 rotate-12 text-8xl opacity-90">🔥</span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-5 md:grid-cols-4">
        {[["Total solved", tot.cf + tot.lc, "var(--yellow)"], ["Codeforces", tot.cf, "var(--sky)"], ["LeetCode", tot.lc, "var(--orange)"], ["CF rating", rating ?? "—", "var(--violet)"]].map(([l, v, c]) => (
          <div key={l as string} className="brut p-4">
            <div className="mb-1 h-2 w-10 rounded-full border-2 border-ink" style={{ background: c as string }} />
            <p className="text-xs font-bold uppercase tracking-wider text-muted">{l}</p>
            <p className="font-mono text-3xl font-bold">{v}</p>
          </div>
        ))}
      </section>

      <section className="brut p-5">
        <h2 className="h-title mb-3 text-2xl">365 days of grind</h2>
        <Heatmap data={heatmap()} />
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <div className="brut p-5 md:col-span-2">
          <h2 className="h-title mb-2 text-2xl">Codeforces rating</h2>
          <RatingChart data={hist} />
        </div>
        <div className="brut p-5">
          <h2 className="h-title mb-3 text-2xl">Badges <span className="font-mono text-base text-muted">{earned.size}/{BADGES.length}</span></h2>
          <div className="flex flex-wrap gap-3">
            {BADGES.map((b, i) => <Sticker key={b.id} badge={b} earned={earned.has(b.id)} i={i} />)}
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <div className="brut p-5">
          <h2 className="h-title mb-2 text-2xl">CF solves by rating</h2>
          <Bars data={diff.cf} x="bucket" color="var(--sky)" />
        </div>
        <div className="brut p-5">
          <h2 className="h-title mb-2 text-2xl">LC by difficulty</h2>
          <Bars data={diff.lc} x="name" color="var(--orange)" />
        </div>
      </section>

      <section className="brut p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="h-title text-2xl">Recent solves</h2>
          <Link href="/next" className="btn !bg-pink text-sm">Next Up →</Link>
        </div>
        <ul className="divide-y-2 divide-ink/10">
          {recentSolves().map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-2">
              <span className={`chip ${r.platform === "cf" ? "bg-sky" : "bg-orange"}`}>{r.platform.toUpperCase()}</span>
              <a href={r.url} target="_blank" rel="noreferrer" className="flex-1 truncate font-semibold hover:underline">{r.title}</a>
              <span className="font-mono text-xs text-muted">{r.rating ?? r.difficulty ?? ""}</span>
              <span className="hidden font-mono text-xs text-muted sm:inline">{new Date(r.solvedAt!).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
