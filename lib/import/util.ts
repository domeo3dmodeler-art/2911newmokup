// app/lib/import/util.ts
export function dedupeBy<T>(arr: T[], key: (x:T)=>string) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of arr) {
    const k = key(x);
    if (!k || seen.has(k)) continue;
    seen.add(k); out.push(x);
  }
  return out;
}