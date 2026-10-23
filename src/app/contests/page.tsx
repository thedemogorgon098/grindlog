import { requireSettings } from "@/lib/guard";
import { cf, type CfContest } from "@/lib/cf";
import Countdown from "@/components/Countdown";

export default async function Contests() {
  requireSettings();
  let list: CfContest[] = [], error = false;
  try {
    list = (await cf.contests()).filter((c) => c.startTimeSeconds).sort((a, b) => a.startTimeSeconds! - b.startTimeSeconds!);
  } catch {
    error = true;
  }
  const colors = ["var(--lime)", "var(--sky)", "var(--yellow)", "var(--pink)"];
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="h-title text-4xl sm:text-5xl">Upcoming contests</h1>
        <p className="text-muted">Live from the Codeforces API. Times in your timezone.</p>
      </div>
      {error && <div className="brut !bg-yellow p-4 font-bold text-noir">Codeforces is unreachable right now. Try again in a bit.</div>}
      {!error && !list.length && <div className="brut p-4">No upcoming contests announced.</div>}
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((c, i) => {
          const start = c.startTimeSeconds! * 1000;
          const div = c.name.match(/Div\. ?\d(?: \+ Div\. ?\d)?|Educational|Global/)?.[0];
          return (
            <a key={c.id} href={`https://codeforces.com/contests/${c.id}`} target="_blank" rel="noreferrer"
              className={`brut group block p-5 transition-transform hover:-translate-y-1 ${i === 0 ? "md:col-span-2" : ""}`}>
              <div className="flex flex-wrap items-center gap-2">
                {div && <span className="chip" style={{ background: colors[i % 4] }}>{div}</span>}
                <span className="font-mono text-xs text-muted">{Math.round(c.durationSeconds / 60)} min</span>
              </div>
              <h2 className={`h-title mt-1 ${i === 0 ? "text-3xl" : "text-xl"} group-hover:underline`}>{c.name}</h2>
              <p className="font-mono text-sm text-muted">{new Date(start).toLocaleString("en", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              <Countdown to={start} big={i === 0} />
            </a>
          );
        })}
      </div>
    </div>
  );
}
