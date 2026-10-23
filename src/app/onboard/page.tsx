import ProfileForm from "@/components/ProfileForm";

export default function Onboard() {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <h1 className="h-title mb-2 text-5xl leading-[0.95] sm:text-7xl">
          GRIND<span className="inline-block -rotate-3 rounded-xl border-[3px] border-ink bg-pink px-2 text-noir shadow-[5px_5px_0_var(--ink)]">LOG</span>
        </h1>
        <p className="mb-6 max-w-md text-lg">
          Your daily LeetCode + Codeforces grind, tracked. Streaks, weak spots and a fresh <b>Next Up</b> list every morning.
        </p>
        <div className="brut relative p-5 sm:p-7">
          <span className="sticker absolute -right-3 -top-5 rotate-6 bg-yellow px-3 py-1 text-sm font-black">NO SIGNUP</span>
          <ProfileForm init={{ lc: "", cf: "", dailyGoal: 3, freezesPerMonth: 2 }} cta="Start grinding →" />
        </div>
      </div>
    </div>
  );
}
