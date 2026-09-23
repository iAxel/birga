/**
 * The vocalization detector (SPEC §3). It never hears words, only how loud the room is: a sound louder than the room
 * for long enough counts as the child taking his turn. Everything here is a pure function over the stream of
 * `(timestamp, dB)` samples the recorder produces, so it can be tested without a microphone.
 */

/** One metering reading: dBFS as the recorder reports it, so a quiet room sits far below zero. */
export interface LevelSample {
  ts: number
  db: number
}

export interface DetectorConfig {
  /** How far above the room a sound has to be to count as the child's (SPEC §5, a setting). */
  marginDb: number
  /** How long the sound has to hold above that. */
  triggerMs: number
}

export interface Detector {
  /** What the room itself measures; kept from the last measurement until a new one closes. */
  baselineDb: number
  /** Readings of the measurement that is running, oldest first; empty once it has closed. */
  measured: number[]
  /** When the running measurement started, and how long it lasts; null once it has closed. */
  measuringSince: number | null
  measureMs: number
  /** Since when the level has stayed above the threshold without falling back. */
  aboveSince: number | null
  /** When the sound had lasted long enough to count; null until then, and set only once. */
  vocalizedAt: number | null
}

/** SPEC §3: 250 ms above the threshold is a vocalization. */
export const TRIGGER_MS = 250

/** SPEC §5: how far above the room counts, by default. */
export const DEFAULT_MARGIN_DB = 12

/** The room is measured for this long before every pause window, so the baseline follows the room. */
export const MEASURE_MS = 500

/** The longer measurement the game takes while it waits on its play button, before any round has started. */
export const FIRST_MEASURE_MS = 2000

/** Until the microphone has heard anything, a quiet room is assumed; the first measurement replaces it. */
export const DEFAULT_BASELINE_DB = -50

/** Opens a listening window: the room is measured first, and only then is anything counted as the child. */
export function openListening(baselineDb: number, now: number, measureMs: number): Detector {
  return {
    baselineDb,
    measured: [],
    measuringSince: now,
    measureMs,
    aboveSince: null,
    vocalizedAt: null,
  }
}

/** Whether the measurement of the room has closed, which is when listening for the child begins. */
export function isMeasured(detector: Detector): boolean {
  return detector.measuringSince === null
}

/** The level a sound has to pass to count as the child's. */
export function thresholdDb(detector: Detector, config: DetectorConfig): number {
  return detector.baselineDb + config.marginDb
}

/**
 * One reading further. While the measurement runs, the reading only describes the room; afterwards it is compared with
 * the threshold, and a sound that holds above it for triggerMs sets vocalizedAt once and for good.
 */
export function feedLevel(detector: Detector, sample: LevelSample, config: DetectorConfig): Detector {
  if (!Number.isFinite(sample.db)) {
    return detector
  }

  if (detector.measuringSince !== null) {
    return measure(detector, sample)
  }

  if (detector.vocalizedAt !== null) {
    return detector
  }

  if (sample.db < thresholdDb(detector, config)) {
    return detector.aboveSince === null
      ? detector
      : {
          ...detector,
          aboveSince: null,
        }
  }

  const aboveSince = detector.aboveSince ?? sample.ts

  return {
    ...detector,
    aboveSince,
    vocalizedAt: sample.ts - aboveSince >= config.triggerMs ? sample.ts : null,
  }
}

/** The measurement closes once its time is up: the room is the median of what it heard, which ignores a stray knock. */
function measure(detector: Detector, sample: LevelSample): Detector {
  const measured = [...detector.measured, sample.db]

  if (detector.measuringSince === null || sample.ts - detector.measuringSince < detector.measureMs) {
    return {
      ...detector,
      measured,
    }
  }

  return {
    ...detector,
    baselineDb: median(measured),
    measured: [],
    measuringSince: null,
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((one, other) => one - other)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 1) {
    return sorted[middle]
  }

  return (sorted[middle - 1] + sorted[middle]) / 2
}
