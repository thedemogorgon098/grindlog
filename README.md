# GRINDLOG
Tracks your daily LeetCode + Codeforces grind and picks 5 problems to solve next.

- **Run:** `npm install && npm run dev`, open http://localhost:3000, enter your handles (or `demo`).
- **Data:** local SQLite at `data/grindlog.db`, tables auto-created; delete the file to reset.
- **Sync:** cron at 06:00 and 23:50, on boot if stale (>6h), plus the "Sync now" button. Snapshots are stored per day.
- **APIs:** official Codeforces API + unofficial LeetCode GraphQL (retries, cached). If one is down, demo data fills in until a sync succeeds.
- **Next Up:** weak tags × target difficulty (CF level +100–200, LC Medium/Hard), plus spaced-repetition revisits; cached per day.
- **Stack:** Next.js 16 · Tailwind 4 · Drizzle + better-sqlite3 · Recharts · node-cron.
