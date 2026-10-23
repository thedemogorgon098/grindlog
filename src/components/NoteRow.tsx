"use client";
import { useState, useTransition } from "react";
import { saveNote } from "@/app/actions";

type R = { id: string; title: string; url: string; platform: "cf" | "lc"; meta: string; solvedAt: number | null; attempts: number };

export default function NoteRow({ row, note }: { row: R; note: { text: string; revisit: boolean } }) {
  const [text, setText] = useState(note.text);
  const [open, setOpen] = useState(!!note.text);
  const [saved, setSaved] = useState(true);
  const [pending, start] = useTransition();
  const save = () => start(async () => { await saveNote(row.id, { text }); setSaved(true); });

  return (
    <div className={`brut p-3 ${note.revisit ? "!border-violet" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`chip ${row.platform === "cf" ? "bg-sky" : "bg-orange"}`}>{row.platform.toUpperCase()}</span>
        <a href={row.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-bold hover:underline">{row.title}</a>
        <span className="font-mono text-xs text-muted">{row.meta} · {row.solvedAt ? `✓ ${new Date(row.solvedAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "2-digit" })}` : "✗ unsolved"} · {row.attempts} tries</span>
        <button onClick={() => setOpen(!open)} className="btn !bg-card !px-2 !py-0.5 text-sm !text-ink">✎</button>
        <button onClick={() => start(() => saveNote(row.id, { revisit: !note.revisit }))} disabled={pending}
          className={`btn !px-2 !py-0.5 text-sm ${note.revisit ? "!bg-violet" : "!bg-card !text-ink"}`} title="Revisit later">⚑</button>
      </div>
      {open && (
        <div className="mt-2 grid gap-2">
          <textarea value={text} onChange={(e) => { setText(e.target.value); setSaved(false); }} onBlur={() => !saved && save()} rows={3}
            placeholder="Key insight, edge case, the trick you missed…" className="input font-sans" />
          <span className="font-mono text-xs text-muted">{pending ? "saving…" : saved ? "saved" : "unsaved, click away to save"}</span>
        </div>
      )}
    </div>
  );
}
