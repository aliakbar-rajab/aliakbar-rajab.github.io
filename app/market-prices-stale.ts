import type { MarketPriceData } from "./use-market-prices";

// The endpoint's own fresh window is 5 minutes; treating anything past
// ~15 minutes as stale gives one missed refresh of slack before surfacing
// it, rather than waiting hours.
export const STALE_AFTER_MS = 15 * 60 * 1000;

function isTimestampStale(value: unknown, now: number): boolean {
  if (typeof value !== "string") return true;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return true;
  return now - time > STALE_AFTER_MS;
}

export function isMarketPriceDataStale(
  data: Pick<MarketPriceData, "fetchedAt" | "items">,
  now: number = Date.now(),
): boolean {
  if (isTimestampStale(data.fetchedAt, now)) return true;
  return data.items.some((item) => isTimestampStale(item?.updatedAt, now));
}
