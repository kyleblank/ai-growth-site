export function fmtNum(n: number): string {
  if (n >= 10000) {
    const w = n / 10000;
    return (w >= 100 ? w.toFixed(0) : w.toFixed(1).replace(/\.0$/, "")) + "万";
  }
  return n.toLocaleString("zh-CN");
}

export function fmtRate(r: number): string {
  return r.toFixed(2).replace(/^0\./, "0.") ;
}

export function fmtDate(iso: string): string {
  return iso.replace(/-/g, ".");
}
