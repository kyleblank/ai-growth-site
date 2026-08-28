/**
 * 站内路径统一处理：
 * 部署在 https://kyleblank.github.io/ai-growth-site/ 下，
 * 所有内部链接需要带 base 前缀，本地开发时 BASE_URL 为 "/" 自动退化为原始路径。
 */
export function sitePath(path: string): string {
  if (!path.startsWith("/")) return path;
  const base = import.meta.env.BASE_URL;
  if (base.endsWith("/")) return base + path.slice(1);
  return base + path;
}
