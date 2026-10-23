import { sqliteTable, text, integer, real, primaryKey } from "drizzle-orm/sqlite-core";

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  lc: text("lc"),
  cf: text("cf"),
  dailyGoal: integer("daily_goal").notNull().default(3),
  freezesPerMonth: integer("freezes_per_month").notNull().default(2),
  lastSync: integer("last_sync"),
});

export const problems = sqliteTable("problems", {
  id: text("id").primaryKey(),
  platform: text("platform", { enum: ["cf", "lc"] }).notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  difficulty: text("difficulty"),
  rating: integer("rating"),
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
  paid: integer("paid", { mode: "boolean" }).notNull().default(false),
});

export const progress = sqliteTable("progress", {
  problemId: text("problem_id").primaryKey(),
  attempts: integer("attempts").notNull().default(0),
  solvedAt: integer("solved_at"),
  reviewCount: integer("review_count").notNull().default(0),
  lastReviewAt: integer("last_review_at"),
});

export const activity = sqliteTable("activity", {
  day: text("day").notNull(),
  platform: text("platform").notNull(),
  count: integer("count").notNull(),
}, (t) => [primaryKey({ columns: [t.day, t.platform] })]);

export const snapshots = sqliteTable("snapshots", {
  day: text("day").notNull(),
  platform: text("platform").notNull(),
  total: integer("total").notNull(),
  easy: integer("easy").notNull().default(0),
  medium: integer("medium").notNull().default(0),
  hard: integer("hard").notNull().default(0),
  rating: integer("rating"),
}, (t) => [primaryKey({ columns: [t.day, t.platform] })]);

export const ratings = sqliteTable("ratings", {
  contestId: integer("contest_id").primaryKey(),
  name: text("name").notNull(),
  at: integer("at").notNull(),
  rating: integer("rating").notNull(),
});

export const recs = sqliteTable("recs", {
  day: text("day").notNull(),
  problemId: text("problem_id").notNull(),
  score: real("score").notNull(),
  why: text("why").notNull(),
  kind: text("kind", { enum: ["new", "revisit"] }).notNull(),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
}, (t) => [primaryKey({ columns: [t.day, t.problemId] })]);

export const notes = sqliteTable("notes", {
  problemId: text("problem_id").primaryKey(),
  text: text("text").notNull().default(""),
  revisit: integer("revisit", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at").notNull(),
});

export const badges = sqliteTable("badges", {
  id: text("id").primaryKey(),
  earnedAt: integer("earned_at").notNull(),
});

export const kv = sqliteTable("kv", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at"),
});
