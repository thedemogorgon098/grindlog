"use client";

export default function ThemeToggle() {
  const toggle = () => {
    const dark = document.documentElement.classList.toggle("dark");
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch {}
  };
  return (
    <button onClick={toggle} aria-label="Toggle dark mode" className="btn shrink-0 !bg-violet !px-2.5 !py-1.5 text-lg leading-none">
      <span className="dark:hidden">☾</span>
      <span className="hidden dark:inline">☀</span>
    </button>
  );
}
