export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const cron = (await import("node-cron")).default;
  const { syncAll } = await import("./lib/sync");
  const { getSettings } = await import("./lib/settings");
  const run = () => getSettings() && syncAll().catch((e) => console.error("[grindlog] cron sync failed", e));
  // Morning sync + late-evening snapshot so day-over-day deltas stay accurate.
  cron.schedule("0 6 * * *", run);
  cron.schedule("50 23 * * *", run);
  const s = getSettings();
  if (s && Date.now() - (s.lastSync ?? 0) > 6 * 3_600_000) run();
}
