import { retry } from "./cache";


async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  return retry(async () => {
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
      headers: { "Content-Type": "application/json", Referer: "https://leetcode.com", "User-Agent": "Mozilla/5.0 grindlog" },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`LC HTTP ${res.status}`);
    const json = await res.json();
    if (json.errors?.length) throw new Error(`LC: ${json.errors[0].message}`);
    return json.data as T;
  });
}

export type LcQuestion = { difficulty: string; questionFrontendId: string; isPaidOnly: boolean; title: string; titleSlug: string; topicTags: { name: string }[] };
type TagCount = { tagName: string; problemsSolved: number };
export type LcProfile = {
  matchedUser: null | {
    submitStats: { acSubmissionNum: { difficulty: string; count: number; submissions: number }[] };
    tagProblemCounts: { advanced: TagCount[]; intermediate: TagCount[]; fundamental: TagCount[] };
    userCalendar: { submissionCalendar: string };
  };
  recentAcSubmissionList: { title: string; titleSlug: string; timestamp: string }[] | null;
};

const PROFILE = `query($u:String!,$y:Int){
  matchedUser(username:$u){
    submitStats:submitStatsGlobal{acSubmissionNum{difficulty count submissions}}
    tagProblemCounts{advanced{tagName problemsSolved} intermediate{tagName problemsSolved} fundamental{tagName problemsSolved}}
    userCalendar(year:$y){submissionCalendar}
  }
  recentAcSubmissionList(username:$u,limit:20){title titleSlug timestamp}
}`;

const LIST = `query($l:Int,$s:Int){questionList(categorySlug:"",limit:$l,skip:$s,filters:{}){totalNum data{difficulty questionFrontendId isPaidOnly title titleSlug topicTags{name}}}}`;

export const lcUrl = (slug: string) => `https://leetcode.com/problems/${slug}/`;

export const lc = {
  async profile(u: string) {
    const y = new Date().getFullYear();
    const [cur, prev] = await Promise.all([gql<LcProfile>(PROFILE, { u, y }), gql<LcProfile>(PROFILE, { u, y: y - 1 }).catch(() => null)]);
    if (!cur.matchedUser) throw new Error(`LeetCode user "${u}" not found`);
    const cal = { ...JSON.parse(prev?.matchedUser?.userCalendar.submissionCalendar || "{}"), ...JSON.parse(cur.matchedUser.userCalendar.submissionCalendar || "{}") } as Record<string, number>;
    return { ...cur.matchedUser, calendar: cal, recent: cur.recentAcSubmissionList ?? [] };
  },
  async problems() {
    const out: LcQuestion[] = [];
    for (let s = 0; ; s += 1000) {
      const r = await gql<{ questionList: { totalNum: number; data: LcQuestion[] } }>(LIST, { l: 1000, s });
      out.push(...r.questionList.data);
      if (s + 1000 >= r.questionList.totalNum || !r.questionList.data.length) return out;
    }
  },
};
