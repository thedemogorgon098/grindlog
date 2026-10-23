import type { NextConfig } from "next";

const config: NextConfig = { serverExternalPackages: ["better-sqlite3", "node-cron"] };
export default config;
