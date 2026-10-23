"use client";
import { useEffect, useState } from "react";

export default function Countdown({ to, big }: { to: number; big?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, to - (now ?? to));
  const parts: [number, string][] = [[Math.floor(left / 86_400_000), "d"], [Math.floor(left / 3_600_000) % 24, "h"], [Math.floor(left / 60_000) % 60, "m"], [Math.floor(left / 1000) % 60, "s"]];
  return (
    <div className="mt-3 flex gap-2" suppressHydrationWarning>
      {parts.map(([v, u]) => (
        <span key={u} className={`rounded-lg border-[3px] border-ink bg-paper text-center font-mono font-bold ${big ? "min-w-16 px-2 py-1 text-3xl" : "min-w-12 px-1.5 text-lg"}`}>
          {now == null ? "--" : String(v).padStart(2, "0")}<span className="text-xs text-muted">{u}</span>
        </span>
      ))}
    </div>
  );
}
