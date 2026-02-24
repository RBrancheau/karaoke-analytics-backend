import { mean, standardDeviation } from "./stats";

export function detectChurnSpikes(
  dropTimestamps: number[],
  sessionStart: number,
  sessionEnd: number,
  binMinutes: number
) {
  const binMs = binMinutes * 60 * 1000;
  const bins: Record<number, number> = {};

  for (let t = sessionStart; t < sessionEnd; t += binMs) {
    bins[t] = 0;
  }

  dropTimestamps.forEach(ts => {
    const bucket = sessionStart + Math.floor((ts - sessionStart) / binMs) * binMs;
    if (bins[bucket] !== undefined) bins[bucket]++;
  });

  const counts = Object.values(bins);
  if (counts.length === 0) return [];

  const avg = mean(counts);
  const std = standardDeviation(counts);

  return Object.entries(bins)
    .filter(([_, count]) => count > avg + 2 * std)
    .map(([start, count]) => ({
      start: Number(start),
      end: Number(start) + binMs,
      drop_count: count
    }));
}