import { requireSettings } from "@/lib/guard";
import { tagStats } from "@/lib/stats";

export default function Weakness() {
  requireSettings();
  const tags = tagStats();
  const max = Math.max(1, ...tags.map((t) => t.solved));
  const weakest = new Set(tags.slice(0, 3).map((t) => t.tag));

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="h-title text-4xl sm:text-5xl">Weak spots</h1>
        <p className="max-w-2xl text-muted">Weakness blends low volume (vs your strongest tag) with low Codeforces accuracy (accepted problems ÷ submissions). Highest score = what Next Up feeds you.</p>
      </div>

      <section className="grid gap-5 md:grid-cols-3">
        {tags.slice(0, 3).map((t, i) => (
          <div key={t.tag} className="brut relative !bg-red p-5 text-noir" style={{ transform: `rotate(${[-1.2, 0.8, -0.6][i]}deg)` }}>
            <span className="sticker absolute -right-2 -top-4 rotate-6 bg-yellow px-2 text-sm font-black">#{i + 1} WEAKEST</span>
            <h2 className="h-title text-3xl">{t.tag}</h2>
            <p className="mt-2 font-mono text-sm">{t.solved} solved · {t.success != null ? `${Math.round(t.success * 100)}% acc` : "no CF data"}</p>
            <p className="font-mono text-sm">weakness {(t.weakness * 100).toFixed(0)}</p>
          </div>
        ))}
      </section>

      <section className="brut overflow-x-auto p-5">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr className="border-b-[3px] border-ink text-xs uppercase tracking-wider text-muted">
              <th className="py-2">Tag</th>
              <th>Solved (CF + LC)</th>
              <th className="text-right">CF acc.</th>
              <th className="text-right">Weakness</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((t) => (
              <tr key={t.tag} className={`border-b-2 border-ink/10 ${weakest.has(t.tag) ? "bg-red/15" : ""}`}>
                <td className="py-2 pr-3 font-bold">{weakest.has(t.tag) && "⚠ "}{t.tag}</td>
                <td className="pr-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-4 w-48 overflow-hidden rounded border-2 border-ink bg-paper">
                      <div className="h-full bg-sky" style={{ width: `${(t.cfSolved / max) * 100}%` }} title={`Codeforces: ${t.cfSolved}`} />
                      <div className="h-full bg-orange" style={{ width: `${(t.lcSolved / max) * 100}%` }} title={`LeetCode: ${t.lcSolved}`} />
                    </div>
                    <span className="font-mono text-sm">{t.solved}</span>
                  </div>
                </td>
                <td className="text-right font-mono text-sm">{t.success != null ? `${Math.round(t.success * 100)}%` : "—"}</td>
                <td className="text-right">
                  <span className="font-mono text-sm font-bold">{(t.weakness * 100).toFixed(0)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 flex gap-3 text-xs text-muted">
          <span><span className="mr-1 inline-block h-3 w-3 rounded-sm border-2 border-ink bg-sky align-middle" />Codeforces</span>
          <span><span className="mr-1 inline-block h-3 w-3 rounded-sm border-2 border-ink bg-orange align-middle" />LeetCode</span>
        </p>
      </section>
    </div>
  );
}
