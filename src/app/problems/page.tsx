import Link from "next/link";
import { db, notes } from "@/db";
import { requireSettings } from "@/lib/guard";
import { progressRows } from "@/lib/stats";
import NoteRow from "@/components/NoteRow";

export default async function Problems({ searchParams }: { searchParams: Promise<{ q?: string; f?: string }> }) {
  requireSettings();
  const { q = "", f = "all" } = await searchParams;
  const noteMap = new Map(db.select().from(notes).all().map((n) => [n.problemId, n]));
  const rows = progressRows()
    .filter((r) => (f === "revisit" ? noteMap.get(r.id)?.revisit : f === "notes" ? noteMap.get(r.id)?.text : f === "unsolved" ? !r.solvedAt : true))
    .filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()) || r.tags.some((t) => t.toLowerCase() === q.toLowerCase()))
    .sort((a, b) => (b.solvedAt ?? 0) - (a.solvedAt ?? 0))
    .slice(0, 100);
  const filters = [["all", "All"], ["revisit", "⚑ Revisit"], ["notes", "✎ Has notes"], ["unsolved", "✗ Unsolved"]];

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="h-title text-4xl sm:text-5xl">Notes & revisits</h1>
        <p className="text-muted">Jot down the trick, flag it to come back. Flagged problems jump into Next Up.</p>
      </div>
      <form className="flex flex-wrap gap-3">
        <input name="q" defaultValue={q} placeholder="Search title or tag…" className="input max-w-sm flex-1" />
        <input type="hidden" name="f" value={f} />
        <button className="btn">Search</button>
      </form>
      <div className="flex flex-wrap gap-2">
        {filters.map(([k, l]) => (
          <Link key={k} href={`/problems?f=${k}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-lg border-[3px] border-ink px-3 py-1 text-sm font-bold ${f === k ? "bg-violet text-noir shadow-[3px_3px_0_var(--ink)]" : ""}`}>{l}</Link>
        ))}
      </div>
      <div className="grid gap-3">
        {rows.map((r) => {
          const n = noteMap.get(r.id);
          return <NoteRow key={r.id} row={{ id: r.id, title: r.title, url: r.url, platform: r.platform, meta: String(r.rating ?? r.difficulty ?? ""), solvedAt: r.solvedAt, attempts: r.attempts }} note={{ text: n?.text ?? "", revisit: n?.revisit ?? false }} />;
        })}
        {!rows.length && <div className="brut p-5 text-muted">Nothing matches.</div>}
      </div>
    </div>
  );
}
