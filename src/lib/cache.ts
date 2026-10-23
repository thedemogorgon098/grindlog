import { db, kv } from "@/db";
import { eq } from "drizzle-orm";

export function kvGet<T>(key: string, allowStale = false): T | undefined {
  const row = db.select().from(kv).where(eq(kv.key, key)).get();
  if (!row || (!allowStale && row.expiresAt && row.expiresAt < Date.now())) return;
  return JSON.parse(row.value) as T;
}

export function kvSet(key: string, value: unknown, ttlMs?: number) {
  const v = { key, value: JSON.stringify(value), expiresAt: ttlMs ? Date.now() + ttlMs : null };
  db.insert(kv).values(v).onConflictDoUpdate({ target: kv.key, set: v }).run();
}

export const kvDel = (key: string) => db.delete(kv).where(eq(kv.key, key)).run();

/** Cache-through with fallback to stale value when fn throws. */
export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = kvGet<T>(key);
  if (hit !== undefined) return hit;
  try {
    const v = await fn();
    kvSet(key, v, ttlMs);
    return v;
  } catch (e) {
    const stale = kvGet<T>(key, true);
    if (stale !== undefined) return stale;
    throw e;
  }
}

export async function retry<T>(fn: () => Promise<T>, tries = 3, delay = 600): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= tries - 1) throw e;
      await new Promise((r) => setTimeout(r, delay * 2 ** i));
    }
  }
}
