const clean = (values: readonly number[]): number[] => values.filter(Number.isFinite);
export const mean = (values: readonly number[]): number | null => {
  const safe = clean(values); return safe.length ? safe.reduce((sum, value) => sum + value, 0) / safe.length : null;
};
export const median = (values: readonly number[]): number | null => percentile(values, 0.5);
export const percentile = (values: readonly number[], ratio: number): number | null => {
  const safe = clean(values).sort((a, b) => a - b);
  if (!safe.length || !Number.isFinite(ratio) || ratio < 0 || ratio > 1) return null;
  const position = (safe.length - 1) * ratio, low = Math.floor(position), high = Math.ceil(position);
  return safe[low]! + (safe[high]! - safe[low]!) * (position - low);
};
export const completionRate = (attempts: number, completions: number): number | null =>
  Number.isFinite(attempts) && attempts > 0 && Number.isFinite(completions)
    ? Math.max(0, Math.min(1, completions / attempts)) : null;
export const topEntry = (values: Readonly<Record<string, number>>): string | null => {
  const entries = Object.entries(values).filter(([, count]) => Number.isFinite(count) && count > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return entries[0]?.[0] ?? null;
};
export const dispersion = (values: readonly number[]): number | null => {
  const safe = clean(values), average = mean(safe);
  if (safe.length < 2 || average === null) return null;
  return Math.sqrt(safe.reduce((sum, value) => sum + (value - average) ** 2, 0) / safe.length);
};
export const slowestSegment = (segments: Readonly<Record<string, readonly number[]>>): string | null =>
  rankedSegment(segments, (values) => mean(values));
export const mostInconsistentSegment = (segments: Readonly<Record<string, readonly number[]>>): string | null =>
  rankedSegment(segments, (values) => values.length < 3 ? null : dispersion(values));
const rankedSegment = (segments: Readonly<Record<string, readonly number[]>>, score: (values: readonly number[]) => number | null): string | null =>
  Object.entries(segments).map(([id, values]) => [id, score(values)] as const)
    .filter((entry): entry is readonly [string, number] => entry[1] !== null)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
