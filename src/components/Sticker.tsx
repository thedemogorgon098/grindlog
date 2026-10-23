const TILT = [-6, 4, -3, 7, -8, 3, -4, 6];

export default function Sticker({ badge, earned, i }: { badge: { label: string; emoji: string; color: string }; earned: boolean; i: number }) {
  return (
    <div title={earned ? badge.label : `Locked: ${badge.label}`}
      className={`sticker flex w-[4.6rem] flex-col items-center px-1 py-1.5 text-center ${earned ? "" : "border-dashed opacity-35 grayscale"}`}
      style={{ background: earned ? badge.color : "var(--card)", transform: `rotate(${TILT[i % TILT.length]}deg)`, color: earned ? "#111" : "var(--ink)", borderColor: earned ? "#111" : "var(--ink)" }}>
      <span className="text-2xl">{badge.emoji}</span>
      <span className="text-[0.62rem] font-black uppercase leading-tight">{badge.label}</span>
    </div>
  );
}
