const DAY_MS = 86_400_000

/** Which parent tip to show on the given day: one tip per calendar day, in list order, starting over at the end. */
export function tipOfDay(now: Date, count: number): number {
  const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS)

  return day % count
}
