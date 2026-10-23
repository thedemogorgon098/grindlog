"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  ["/", "Dash", "var(--yellow)"],
  ["/next", "Next Up", "var(--pink)"],
  ["/weakness", "Weak Spots", "var(--orange)"],
  ["/report", "Weekly", "var(--sky)"],
  ["/contests", "Contests", "var(--lime)"],
  ["/problems", "Notes", "var(--violet)"],
  ["/settings", "Settings", "var(--card)"],
] as const;

export default function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b-[3px] border-ink bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="h-title shrink-0 text-2xl">
          GRIND<span className="inline-block -rotate-3 rounded-md border-[3px] border-ink bg-pink px-1 text-noir">LOG</span>
        </Link>
        <nav className="no-scrollbar flex flex-1 gap-2 overflow-x-auto py-1 pl-1 pr-2">
          {LINKS.map(([href, label, color]) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link key={href} href={href}
                className={`shrink-0 rounded-lg border-[3px] border-ink px-3 py-1 text-sm font-bold transition-transform hover:-translate-y-0.5 ${active ? "text-noir shadow-[3px_3px_0_var(--ink)]" : "border-transparent"}`}
                style={active ? { background: color === "var(--card)" ? "var(--yellow)" : color } : undefined}>
                {label}
              </Link>
            );
          })}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
