const CELL = 12, GAP = 3, STEP = CELL + GAP;
const level = (n: number) => (n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : 4);

export default function Heatmap({ data }: { data: { day: string; count: number }[] }) {
  const offset = new Date(data[0].day + "T00:00").getDay();
  const weeks = Math.ceil((data.length + offset) / 7);
  const months: { x: number; label: string }[] = [];
  data.forEach((d, i) => {
    if (d.day.endsWith("-01")) months.push({ x: Math.floor((i + offset) / 7) * STEP, label: new Date(d.day + "T00:00").toLocaleString("en", { month: "short" }) });
  });
  const active = data.filter((d) => d.count).length;
  const total = data.reduce((a, d) => a + d.count, 0);
  return (
    <div>
      <div className="overflow-x-auto pb-1" dir="rtl">
        <div dir="ltr" className="inline-block"><svg width={weeks * STEP + 24} height={7 * STEP + 18} className="block font-mono" role="img" aria-label={`${total} solves and submissions across ${active} active days`}>
          {months.map((m) => <text key={m.x + m.label} x={m.x + 24} y={10} fontSize={10} fill="var(--muted)">{m.label}</text>)}
          {["Mon", "Wed", "Fri"].map((l, i) => <text key={l} x={0} y={18 + (i * 2 + 1) * STEP + 9} fontSize={9} fill="var(--muted)">{l}</text>)}
          {data.map((d, i) => {
            const p = i + offset;
            return (
              <rect key={d.day} x={24 + Math.floor(p / 7) * STEP} y={18 + (p % 7) * STEP} width={CELL} height={CELL} rx={3}
                fill={`var(--heat-${level(d.count)})`} stroke="var(--ink)" strokeOpacity={d.count ? 0.85 : 0.15} strokeWidth={1.5}>
                <title>{`${d.day}: ${d.count} solves/submissions`}</title>
              </rect>
            );
          })}
        </svg></div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span className="font-mono">{total} solves + submissions this year · {active} active days</span>
        <span className="flex items-center gap-1">
          Less {[0, 1, 2, 3, 4].map((l) => <span key={l} className="inline-block h-3 w-3 rounded-[3px] border border-ink/40" style={{ background: `var(--heat-${l})` }} />)} More
        </span>
      </div>
    </div>
  );
}
