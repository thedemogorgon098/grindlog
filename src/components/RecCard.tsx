"use client";
import { useTransition } from "react";
import confetti from "canvas-confetti";
import { regenRecs, saveNote, toggleRec } from "@/app/actions";

type Rec = { problemId: string; title: string; url: string; platform: "cf" | "lc"; rating: number | null; difficulty: string | null; tags: string[]; why: string; kind: "new" | "revisit"; done: boolean };

export function RecCard({ rec, i }: { rec: Rec; i: number }) {
  const [pending, start] = useTransition();
  const toggle = (e: React.MouseEvent) => start(async () => {
    if (!rec.done) confetti({ particleCount: 40, spread: 50, origin: { x: e.clientX / innerWidth, y: e.clientY / innerHeight }, shapes: ["square"], colors: ["#b8f35a", "#ffd23f", "#ff7ab6"] });
    await toggleRec(rec.problemId, !rec.done);
  });
  return (
    <div className={`brut flex flex-col gap-3 p-4 transition-opacity sm:flex-row sm:items-center ${rec.done ? "opacity-60" : ""}`}>
      <span className="h-title grid h-12 w-12 shrink-0 place-items-center rounded-lg border-[3px] border-ink text-2xl text-noir" style={{ background: ["var(--yellow)", "var(--pink)", "var(--sky)", "var(--lime)", "var(--violet)"][i % 5] }}>{i + 1}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`chip ${rec.platform === "cf" ? "bg-sky" : "bg-orange"}`}>{rec.platform.toUpperCase()}</span>
          {rec.kind === "revisit" && <span className="chip bg-violet">↺ REVISIT</span>}
          <span className="chip bg-card font-mono text-ink">{rec.rating ?? rec.difficulty}</span>
          {rec.tags.slice(0, 3).map((t) => <span key={t} className="text-xs text-muted">#{t}</span>)}
        </div>
        <a href={rec.url} target="_blank" rel="noreferrer" className={`mt-1 block truncate text-lg font-bold hover:underline ${rec.done ? "line-through" : ""}`}>{rec.title}</a>
        <p className="text-sm"><b>Why:</b> {rec.why}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button className="btn !bg-card text-sm !text-ink" title="Flag to revisit later" onClick={() => start(() => saveNote(rec.problemId, { revisit: true }))}>⚑</button>
        <button className={`btn text-sm ${rec.done ? "!bg-card !text-ink" : "!bg-lime"}`} disabled={pending} onClick={toggle}>{rec.done ? "Undo" : "Done ✓"}</button>
      </div>
    </div>
  );
}

export function RegenButton() {
  const [pending, start] = useTransition();
  return <button className="btn !bg-pink" disabled={pending} onClick={() => start(() => regenRecs())}>{pending ? "Shuffling…" : "🎲 Reroll"}</button>;
}
