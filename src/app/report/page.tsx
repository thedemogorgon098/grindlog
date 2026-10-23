import { requireSettings } from "@/lib/guard";
import { weeklyReport } from "@/lib/stats";
import { Bars } from "@/components/Charts";

export default function Report() {
  requireSettings();
  const r = weeklyReport();
  const delta = r.solves.total - r.prev;
  const fmt = (d: string) => new Date(d + "T00:00").toLocaleDateString("en", { month: "short", day: "numeric" });
  const tiles: [string, string | number, string, string][] = [
    ["Solves", r.solves.total, `${delta >= 0 ? "+" : ""}${delta} vs last week`, "var(--yellow)"],
    ["Active days", `${r.activeDays}/7`, `CF ${r.solves.cf} · LC ${r.solves.lc}`, "var(--lime)"],
    ["Rating change", `${r.ratingDelta > 0 ? "+" : ""}${r.ratingDelta}`, "Codeforces, this week", "var(--violet)"],
  ];
  return (
    <div className="grid gap-5">
      <div>
        <p className="font-mono text-sm text-muted">{fmt(r.from)} → {fmt(r.to)}</p>
        <h1 className="h-title text-4xl sm:text-5xl">Weekly report</h1>
      </div>
      <div className="brut relative !bg-pink p-6 text-noir">
        <span className="sticker absolute -top-4 left-4 -rotate-3 bg-yellow px-2 text-sm font-black">INSIGHT</span>
        <p className="h-title text-2xl sm:text-3xl">{r.insight}</p>
      </div>
      <section className="grid gap-5 sm:grid-cols-3">
        {tiles.map(([l, v, sub, c]) => (
          <div key={l} className="brut p-5">
            <div className="mb-1 h-2 w-10 rounded-full border-2 border-ink" style={{ background: c }} />
            <p className="text-xs font-bold uppercase tracking-wider text-muted">{l}</p>
            <p className="font-mono text-5xl font-bold">{v}</p>
            <p className="font-mono text-sm text-muted">{sub}</p>
          </div>
        ))}
      </section>
      <section className="grid gap-5 md:grid-cols-3">
        <div className="brut p-5 md:col-span-2">
          <h2 className="h-title mb-2 text-2xl">Daily activity</h2>
          <Bars data={r.daily} x="day" color="var(--lime)" name="Solves + subs" />
        </div>
        <div className="brut p-5">
          <h2 className="h-title mb-3 text-2xl">Tags you pushed</h2>
          {r.improved.length ? (
            <ul className="grid gap-2">
              {r.improved.map(([t, n]) => (
                <li key={t} className="flex items-center justify-between rounded-lg border-2 border-ink px-3 py-1.5">
                  <span className="font-bold">{t}</span>
                  <span className="chip bg-lime font-mono">+{n}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-muted">No tagged solves this week yet.</p>}
        </div>
      </section>
    </div>
  );
}
