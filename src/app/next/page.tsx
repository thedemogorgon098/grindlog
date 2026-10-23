import { requireSettings } from "@/lib/guard";
import { getRecs, cfLevel } from "@/lib/recommend";
import { RecCard, RegenButton } from "@/components/RecCard";

export default function NextUp() {
  requireSettings();
  const recs = getRecs();
  const done = recs.filter((r) => r.done).length;
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h-title text-4xl sm:text-5xl">Next Up</h1>
          <p className="text-muted">Five picks for today: your weak tags, at your level +100–200 (CF ≈ <b className="font-mono">{cfLevel()}</b>), plus spaced-repetition revisits.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg font-bold">{done}/{recs.length} done</span>
          <RegenButton />
        </div>
      </div>
      {recs.length === 0 && <div className="brut p-6">No candidates yet. Sync first so the problem catalog loads.</div>}
      <div className="grid gap-4">
        {recs.map((r, i) => <RecCard key={r.problemId} rec={r} i={i} />)}
      </div>
    </div>
  );
}
