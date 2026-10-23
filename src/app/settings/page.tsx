import ProfileForm from "@/components/ProfileForm";
import { requireSettings } from "@/lib/guard";

export default function Settings() {
  const s = requireSettings();
  return (
    <div className="max-w-2xl">
      <h1 className="h-title mb-5 text-4xl">Settings</h1>
      <div className="brut p-5 sm:p-7">
        <ProfileForm init={{ lc: s.lc ?? "", cf: s.cf ?? "", dailyGoal: s.dailyGoal, freezesPerMonth: s.freezesPerMonth }} cta="Save" />
      </div>
    </div>
  );
}
