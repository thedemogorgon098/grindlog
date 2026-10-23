// Canonical tags shared by both platforms.
const MAP: Record<string, string> = {
  dp: "DP", "dynamic programming": "DP", memoization: "DP",
  greedy: "Greedy",
  graphs: "Graphs", graph: "Graphs", "dfs and similar": "Graphs", "depth-first search": "Graphs", "breadth-first search": "Graphs", "topological sort": "Graphs",
  "shortest paths": "Shortest Paths", "shortest path": "Shortest Paths",
  trees: "Trees", tree: "Trees", "binary tree": "Trees", "binary search tree": "Trees",
  math: "Math", "number theory": "Number Theory",
  combinatorics: "Combinatorics", probabilities: "Combinatorics", "probability and statistics": "Combinatorics",
  "binary search": "Binary Search",
  strings: "Strings", string: "Strings", "string matching": "Strings", hashing: "Hashing", "hash table": "Hashing", "hash function": "Hashing",
  "two pointers": "Two Pointers", "sliding window": "Two Pointers",
  sortings: "Sorting", sorting: "Sorting",
  bitmasks: "Bits", "bit manipulation": "Bits",
  "data structures": "Data Structures", "segment tree": "Data Structures", "binary indexed tree": "Data Structures", heap: "Data Structures", "heap (priority queue)": "Data Structures", stack: "Data Structures", queue: "Data Structures", "monotonic stack": "Data Structures", "linked list": "Data Structures", trie: "Data Structures",
  dsu: "DSU", "union find": "DSU",
  "constructive algorithms": "Constructive",
  implementation: "Implementation", simulation: "Implementation", array: "Implementation", matrix: "Implementation",
  "brute force": "Brute Force", backtracking: "Brute Force", enumeration: "Brute Force", recursion: "Brute Force",
  geometry: "Geometry", games: "Games", "game theory": "Games",
};

export const normTags = (tags: string[]) => [...new Set(tags.map((t) => MAP[t.toLowerCase()]).filter(Boolean))];

export const TAG_LIST = [...new Set(Object.values(MAP))];
