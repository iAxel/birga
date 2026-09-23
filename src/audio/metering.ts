/** SPEC §5: a recording lasts at most 4 s, and one level is kept per tenth of a second. */
export const LEVEL_INTERVAL_MS = 100

/** Quietest level that still shows as a bar, so a recorded stretch never looks empty. */
const MIN_LEVEL = 0.06

/** Below this the microphone is as good as silent; at 0 dB it is at the top of its range. */
const SILENCE_DB = -50

/** One bar height from a microphone reading in decibels, from 0 (silence) to 1 (as loud as it gets). */
export function meteringLevel(decibels: number): number {
  if (!Number.isFinite(decibels)) {
    return 0
  }

  const level = (decibels - SILENCE_DB) / -SILENCE_DB

  return Math.min(1, Math.max(0, level))
}

/** Levels of a take that never got a reading, so its bars are drawn at the smallest visible height. */
export function levelOrMinimum(level: number): number {
  return Math.max(MIN_LEVEL, level)
}

/** Stands in for a recording made before the app kept its shape: as many flat bars as the recording is long. */
export function flatLevels(durationSeconds: number): number[] {
  const count = Math.round((durationSeconds * 1000) / LEVEL_INTERVAL_MS)

  return new Array(Math.max(0, count)).fill(0)
}

/** One level per interval of a take: the readings taken, cut or padded to the length the take actually lasted. */
export function trimLevels(levels: number[], durationMs: number): number[] {
  const wanted = Math.max(1, Math.round(durationMs / LEVEL_INTERVAL_MS))

  return Array.from({ length: wanted }, (_, index) => levels[index] ?? 0)
}
