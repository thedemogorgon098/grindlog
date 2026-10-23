"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncNow } from "@/app/actions";

export default function SyncButton({ lastSync }: { lastSync: number | null }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const ago = lastSync ? Math.round((Date.now() - lastSync) / 60000) : null;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button className="btn" disabled={pending} onClick={() => start(async () => {
        const e = await syncNow();
        setErr(Object.entries(e).map(([p, m]) => `${p.toUpperCase()}: ${m}`).join(" · ") || null);
        router.refresh();
      })}>
        <span className={pending ? "inline-block animate-spin" : ""}>↻</span> {pending ? "Syncing…" : "Sync now"}
      </button>
      <span className="font-mono text-xs text-muted">
        {err ?? (ago == null ? "never synced" : ago < 1 ? "synced just now" : ago < 60 ? `synced ${ago}m ago` : `synced ${Math.round(ago / 60)}h ago`)}
      </span>
    </div>
  );
}
