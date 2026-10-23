import { db, settings } from "@/db";
import { eq } from "drizzle-orm";

export function getSettings() {
  return db.select().from(settings).where(eq(settings.id, 1)).get() ?? null;
}

export function saveSettings(v: Partial<typeof settings.$inferInsert>) {
  db.insert(settings).values({ id: 1, ...v }).onConflictDoUpdate({ target: settings.id, set: v }).run();
}
