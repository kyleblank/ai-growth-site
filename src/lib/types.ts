export interface Stats {
  like: number;
  comment: number;
  collect: number;
  share: number;
}

export interface Blogger {
  id: string;
  name: string;
  platform: "douyin" | "xhs";
  followers: number;
  focus: string;
  homepage?: string;
  /** 各指标基线（近30条中位数），用于计算相对热度分 */
  baseline: Stats;
}

export interface Content {
  id: string;
  bloggerId: string;
  title: string;
  url: string;
  /** 发布日期 YYYY-MM-DD */
  publishedAt: string;
  stats: Stats;
  tags: string[];
  /** watching 值得研究 → done 已研究 / archived 归档 */
  status: "watching" | "done" | "archived";
  note?: string;
}

export type Verdict = "pick" | "skip-gate1" | "skip-gate2" | "skip-window" | "skip-status" | "no-data";

export interface Scored {
  content: Content;
  blogger: Blogger;
  /** 收藏率 = 收藏 ÷ 点赞 */
  collectRate: number | null;
  /** 相对热度分：各指标除以博主基线后加权 */
  hotScore: number | null;
  passedGate1: boolean;
  passedGate2: boolean;
  verdict: Verdict;
  reason: string;
}
