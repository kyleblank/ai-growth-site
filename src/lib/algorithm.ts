import type { Blogger, Content, Scored, Stats } from "./types";

/**
 * 两层筛选算法
 *
 * 第一层 · 收藏率门槛（筛"干货"而不是"火"）
 *   收藏率 = 收藏 ÷ 点赞，抖音 ≥ 0.15 / 小红书 ≥ 0.12
 *
 * 第二层 · 相对热度分（判断是否超出该博主日常水平）
 *   每项指标先除以该博主基线，再加权求和，> 1.5 入选
 *   权重：收藏 40% · 评论 25% · 转发 20% · 点赞 15%
 *
 * 时间窗：只看近 90 天，超过直接排除
 */

export const WEIGHTS = { collect: 0.4, comment: 0.25, share: 0.2, like: 0.15 } as const;

export const COLLECT_RATE_GATE: Record<"douyin" | "xhs", number> = {
  douyin: 0.15,
  xhs: 0.12,
};

export const HOT_SCORE_GATE = 1.5;

export const WINDOW_DAYS = 90;

function daysAgo(dateStr: string, now: Date): number {
  const d = new Date(dateStr + "T00:00:00");
  return (now.getTime() - d.getTime()) / 86400000;
}

export function collectRate(stats: Stats): number | null {
  if (stats.like <= 0) return null;
  return stats.collect / stats.like;
}

export function hotScore(stats: Stats, baseline: Stats): number | null {
  const parts: Array<[number, number, number]> = [
    [stats.collect, baseline.collect, WEIGHTS.collect],
    [stats.comment, baseline.comment, WEIGHTS.comment],
    [stats.share, baseline.share, WEIGHTS.share],
    [stats.like, baseline.like, WEIGHTS.like],
  ];
  // 基线不全时不算分（避免用残缺数据得出虚假结论）
  if (parts.some(([, base]) => !(base > 0))) return null;
  return parts.reduce((sum, [v, base, w]) => sum + (v / base) * w, 0);
}

const platformName = { douyin: "抖音", xhs: "小红书" } as const;

export function evaluateContent(content: Content, blogger: Blogger, now = new Date()): Scored {
  const age = daysAgo(content.publishedAt, now);

  if (age > WINDOW_DAYS) {
    return {
      content, blogger,
      collectRate: collectRate(content.stats),
      hotScore: null,
      passedGate1: false, passedGate2: false,
      verdict: "skip-window",
      reason: `发布于 ${content.publishedAt}，超过 ${WINDOW_DAYS} 天窗口`,
    };
  }

  if (content.status === "archived") {
    return {
      content, blogger,
      collectRate: collectRate(content.stats),
      hotScore: null,
      passedGate1: false, passedGate2: false,
      verdict: "skip-status",
      reason: "已归档",
    };
  }

  const rate = collectRate(content.stats);
  const gate = COLLECT_RATE_GATE[blogger.platform];

  // 数据不完整（点赞缺失无法算收藏率）
  if (rate === null) {
    return {
      content, blogger,
      collectRate: null, hotScore: null,
      passedGate1: false, passedGate2: false,
      verdict: "no-data",
      reason: "互动数据不全，待补充",
    };
  }

  const score = hotScore(content.stats, blogger.baseline);

  // 第一层：收藏率门槛
  if (rate < gate) {
    return {
      content, blogger,
      collectRate: rate, hotScore: score,
      passedGate1: false, passedGate2: false,
      verdict: "skip-gate1",
      reason: `收藏率 ${rate.toFixed(3)} < ${platformName[blogger.platform]}门槛 ${gate}，判定为流量型内容`,
    };
  }

  // 数据完整但基线不全 → 已过第一层，热度分待补
  if (score === null) {
    return {
      content, blogger,
      collectRate: rate, hotScore: null,
      passedGate1: true, passedGate2: false,
      verdict: "no-data",
      reason: "干货型（收藏率达标），但博主基线数据不全，热度分待补",
    };
  }

  // 第二层：相对热度分
  if (score >= HOT_SCORE_GATE) {
    return {
      content, blogger,
      collectRate: rate, hotScore: score,
      passedGate1: true, passedGate2: true,
      verdict: "pick",
      reason: `收藏率 ${rate.toFixed(3)} 达标，热度分为基线 ${score.toFixed(2)} 倍（≥ ${HOT_SCORE_GATE}），值得研究`,
    };
  }

  return {
    content, blogger,
    collectRate: rate, hotScore: score,
    passedGate1: true, passedGate2: false,
    verdict: "skip-gate2",
    reason: `干货型但热度分为基线 ${score.toFixed(2)} 倍（< ${HOT_SCORE_GATE}），属博主日常水平`,
  };
}

export function evaluateAll(
  contents: Content[],
  bloggers: Blogger[],
  now = new Date(),
): Scored[] {
  const bloggerMap = new Map(bloggers.map((b) => [b.id, b]));
  return contents
    .map((c) => {
      const blogger = bloggerMap.get(c.bloggerId);
      if (!blogger) return null;
      return evaluateContent(c, blogger, now);
    })
    .filter((s): s is Scored => s !== null)
    .sort((a, b) => (b.hotScore ?? -1) - (a.hotScore ?? -1));
}

/** 从近 90 天、状态非归档的内容计算博主基线（各指标中位数，抗异常值） */
export function computeBaseline(contents: Content[]): Stats | null {
  const pool = contents.filter(
    (c) => c.status !== "archived" && daysAgo(c.publishedAt, new Date()) <= WINDOW_DAYS,
  );
  if (pool.length < 3) return null;
  const median = (nums: number[]): number => {
    const sorted = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };
  return {
    like: median(pool.map((c) => c.stats.like)),
    comment: median(pool.map((c) => c.stats.comment)),
    collect: median(pool.map((c) => c.stats.collect)),
    share: median(pool.map((c) => c.stats.share)),
  };
}
