"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/app/actions";

type Init = { lc: string; cf: string; dailyGoal: number; freezesPerMonth: number };

export default function ProfileForm({ init, cta }: { init: Init; cta: string }) {
  const [f, setF] = useState(init);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = (k: keyof Init) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.type === "number" ? Number(e.target.value) : e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await saveProfile(f);
      if ("error" in r) return setMsg(r.error ?? null);
      const errs = Object.entries(r.errors ?? {});
      if (errs.length) setMsg(errs.map(([p, m]) => `${p.toUpperCase()}: ${m}. Using demo data.`).join(" "));
      else setMsg("Saved ✓");
      router.push("/");
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 font-bold">
          <span><span className="chip bg-orange">LC</span> LeetCode username</span>
          <input className="input" value={f.lc} onChange={set("lc")} placeholder="e.g. lee215" autoComplete="off" />
        </label>
        <label className="grid gap-1 font-bold">
          <span><span className="chip bg-sky">CF</span> Codeforces handle</span>
          <input className="input" value={f.cf} onChange={set("cf")} placeholder="e.g. tourist" autoComplete="off" />
        </label>
        <label className="grid gap-1 font-bold">
          Daily goal (problems)
          <input className="input" type="number" min={1} max={50} value={f.dailyGoal} onChange={set("dailyGoal")} />
        </label>
        <label className="grid gap-1 font-bold">
          Streak freezes / month
          <input className="input" type="number" min={0} max={10} value={f.freezesPerMonth} onChange={set("freezesPerMonth")} />
        </label>
      </div>
      <p className="text-sm text-muted">Type <b className="font-mono">demo</b> as a handle to explore with sample data. Handles stay in a local SQLite file.</p>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn !bg-lime text-lg" disabled={pending}>{pending ? "Pulling your history…" : cta}</button>
        {msg && <span className="font-mono text-sm">{msg}</span>}
      </div>
    </form>
  );
}
