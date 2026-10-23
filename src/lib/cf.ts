import { cached, retry } from "./cache";

const H = 3_600_000;

async function call<T>(method: string, params: Record<string, string> = {}): Promise<T> {
  return retry(async () => {
    const res = await fetch(`https://codeforces.com/api/${method}?${new URLSearchParams(params)}`, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
    const json = await res.json();
    if (json.status !== "OK") throw new Error(`CF ${method}: ${json.comment ?? res.status}`);
    return json.result as T;
  });
}

export type CfProblem = { contestId?: number; index: string; name: string; rating?: number; tags: string[] };
export type CfSubmission = { id: number; creationTimeSeconds: number; verdict?: string; problem: CfProblem };
export type CfRating = { contestId: number; contestName: string; ratingUpdateTimeSeconds: number; newRating: number };
export type CfContest = { id: number; name: string; phase: string; startTimeSeconds?: number; durationSeconds: number };

export const cfId = (p: CfProblem) => `cf:${p.contestId}${p.index}`;
export const cfUrl = (p: CfProblem) => `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`;

export const cf = {
  info: (h: string) => call<{ handle: string; rating?: number; maxRating?: number; rank?: string }[]>("user.info", { handles: h }).then((r) => r[0]),
  status: (h: string) => call<CfSubmission[]>("user.status", { handle: h }),
  rating: (h: string) => call<CfRating[]>("user.rating", { handle: h }),
  problems: () => call<{ problems: CfProblem[] }>("problemset.problems").then((r) => r.problems),
  contests: () => cached("cf:contests", H, () => call<CfContest[]>("contest.list", { gym: "false" }).then((r) => r.filter((c) => c.phase === "BEFORE"))),
};
