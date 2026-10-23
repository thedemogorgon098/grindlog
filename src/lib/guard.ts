import { redirect } from "next/navigation";
import { getSettings } from "./settings";

export function requireSettings() {
  const s = getSettings();
  if (!s) redirect("/onboard");
  return s;
}
