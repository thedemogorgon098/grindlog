"use client";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const axis = { stroke: "var(--muted)", fontSize: 11, fontFamily: "var(--font-jb)", tickLine: false, axisLine: false };
const tip = {
  contentStyle: { background: "var(--card)", border: "3px solid var(--ink)", borderRadius: 10, boxShadow: "3px 3px 0 var(--ink)", fontFamily: "var(--font-jb)", fontSize: 12, color: "var(--ink)" },
  labelStyle: { fontWeight: 700, color: "var(--ink)" },
  itemStyle: { color: "var(--ink)" },
};
const BANDS: [number, number, string][] = [[0, 1200, "#cccccc"], [1200, 1400, "#77ff77"], [1400, 1600, "#77ddbb"], [1600, 1900, "#aaaaff"], [1900, 2100, "#ff88ff"], [2100, 2400, "#ffcc88"], [2400, 4000, "#ff7777"]];

export function RatingChart({ data }: { data: { at: number; rating: number; name: string }[] }) {
  if (!data.length) return <Empty text="No rated Codeforces contests yet." />;
  const rows = data.map((d) => ({ ...d, label: new Date(d.at).toLocaleDateString("en", { month: "short", year: "2-digit" }) }));
  const min = Math.floor((Math.min(...data.map((d) => d.rating)) - 100) / 100) * 100, max = Math.ceil((Math.max(...data.map((d) => d.rating)) + 100) / 100) * 100;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={rows} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        {BANDS.filter(([a, b]) => b > min && a < max).map(([a, b, c]) => <ReferenceArea key={a} y1={Math.max(a, min)} y2={Math.min(b, max)} fill={c} fillOpacity={0.22} stroke="none" ifOverflow="hidden" />)}
        <XAxis dataKey="label" {...axis} minTickGap={24} />
        <YAxis domain={[min, max]} {...axis} width={48} />
        <Tooltip {...tip} cursor={{ stroke: "var(--ink)", strokeWidth: 1, strokeDasharray: "3 3" }}
          formatter={(v) => [v, "Rating"]} labelFormatter={(_, p) => p?.[0]?.payload?.name ?? ""} />
        <Line type="linear" dataKey="rating" stroke="var(--ink)" strokeWidth={2} dot={{ r: 3.5, fill: "var(--yellow)", stroke: "var(--ink)", strokeWidth: 2 }} activeDot={{ r: 6, fill: "var(--pink)", stroke: "var(--ink)", strokeWidth: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Bars({ data, x, color = "var(--sky)", height = 180, name = "Solved" }: { data: Record<string, string | number>[]; x: string; color?: string; height?: number; name?: string }) {
  if (!data.some((d) => Number(d.count) > 0)) return <Empty text="Nothing here yet." />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--grid)" />
        <XAxis dataKey={x} {...axis} interval={0} />
        <YAxis allowDecimals={false} {...axis} />
        <Tooltip {...tip} cursor={{ fill: "var(--ink)", fillOpacity: 0.06 }} formatter={(v) => [v, name]} />
        <Bar dataKey="count" fill={color} stroke="var(--ink)" strokeWidth={2} radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const Empty = ({ text }: { text: string }) => <div className="grid h-40 place-items-center rounded-lg border-2 border-dashed border-ink/30 text-sm text-muted">{text}</div>;
