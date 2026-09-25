/**
 * The vocalization detector (SPEC §3). It never hears words, only how loud the room is: a sound that rises above the
 * room and holds for long enough counts as the child taking his turn. Everything here is a pure function over the
 * stream of `(timestamp, dB)` samples the recorder produces, so it can be tested without a microphone.
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

/**
 * A measurement of the room, taken in a quiet moment of the app: while the game waits on its play button, and between
 * two rounds. Nothing it hears counts as the child, so a loud room is measured instead of being taken for him.
 */
export interface Measurement {
  startedAt: number
  durationMs: number
  readings: number[]
  /** The loudest reading; the development log prints it to help choose the margin. */
  peakDb: number
}

/** A pause window: every reading is judged against the room, from the first one on. */
export interface Listening {
  baselineDb: number
  /** The readings of the last MEASURE_MS, so a window nobody filled can hand the room on to the next one. */
  recent: LevelSample[]
  /** The loudest reading since the window opened; the development log prints it to help choose the margin. */
  peakDb: number
  /**
   * Whether the level has been below the threshold since the window opened. Only a rise from there counts: a level
   * that is already above it when the microphone opens is the room, or a baseline gone stale, not the child.
   */
  isArmed: boolean
  /** Since when the level has stayed above the threshold without falling back. */
  aboveSince: number | null
  /** When the sound had lasted long enough to count; null until then, and set only once. */
  vocalizedAt: number | null
}

/** SPEC §3: 250 ms above the threshold is a vocalization. */
export const TRIGGER_MS = 250

/** SPEC §5: how far above the room counts, by default. */
export const DEFAULT_MARGIN_DB = 12

/** How much of a pause window nobody filled is handed on as the room. */
export const MEASURE_MS = 500

/** The measurement the game takes while it waits on its play button, before any round has started. */
export const FIRST_MEASURE_MS = 2000

/** The measurement between two rounds, while the finished sequence stays on screen and the app is silent. */
export const ROUND_MEASURE_MS = 1000

/** Until the room has been measured at all, a quiet room is assumed. */
export const DEFAULT_BASELINE_DB = -50

/**
 * The quietest room the detector believes in. The recorder reports -160 dB while its input has not started yet, and
 * a baseline that low would take any sound at all for the child.
 */
export const MIN_BASELINE_DB = -70

/** The top of the microphone's range: no room is louder than that. */
const MAX_BASELINE_DB = 0

/** Fewer readings than this are not a measurement of anything. */
const MIN_MEASURED = 5

/** Keeps a room level inside what the detector believes in. */
export function clampBaselineDb(db: number): number {
  return Math.min(MAX_BASELINE_DB, Math.max(MIN_BASELINE_DB, db))
}

/** The level a sound has to pass to count as the child's. */
export function thresholdDb(baselineDb: number, config: DetectorConfig): number {
  return baselineDb + config.marginDb
}

export function startMeasurement(now: number, durationMs: number): Measurement {
  return {
    startedAt: now,
    durationMs,
    readings: [],
    peakDb: Number.NEGATIVE_INFINITY,
  }
}

/** One reading further into the measurement; a reading the recorder could not give is skipped. */
export function measureLevel(measurement: Measurement, sample: LevelSample): Measurement {
  if (!Number.isFinite(sample.db)) {
    return measurement
  }

  return {
    ...measurement,
    readings: [...measurement.readings, sample.db],
    peakDb: Math.max(measurement.peakDb, sample.db),
  }
}

/** Whether the measurement's time is up at `now`. */
export function isMeasurementOver(measurement: Measurement, now: number): boolean {
  return now - measurement.startedAt >= measurement.durationMs
}

/** What the room measured: the median of the readings, which ignores a stray knock; null when too few arrived. */
export function measuredRoomDb(measurement: Measurement): number | null {
  return roomOf(measurement.readings)
}

/** Opens a pause window against the room the last measurement left. */
export function startListening(baselineDb: number): Listening {
  return {
    baselineDb: clampBaselineDb(baselineDb),
    recent: [],
    peakDb: Number.NEGATIVE_INFINITY,
    isArmed: false,
    aboveSince: null,
    vocalizedAt: null,
  }
}

/**
 * One reading further into the pause window. A sound counts once it has risen above the threshold from below it and
 * held there for triggerMs; vocalizedAt is then set once and for good.
 */
export function listenLevel(listening: Listening, sample: LevelSample, config: DetectorConfig): Listening {
  if (!Number.isFinite(sample.db)) {
    return listening
  }

  const heard = {
    ...listening,
    recent: [...listening.recent, sample].filter((kept) => kept.ts > sample.ts - MEASURE_MS),
    peakDb: Math.max(listening.peakDb, sample.db),
  }

  if (heard.vocalizedAt !== null) {
    return heard
  }

  if (sample.db < thresholdDb(heard.baselineDb, config)) {
    return {
      ...heard,
      isArmed: true,
      aboveSince: null,
    }
  }

  if (!heard.isArmed) {
    return heard
  }

  const aboveSince = heard.aboveSince ?? sample.ts

  return {
    ...heard,
    aboveSince,
    vocalizedAt: sample.ts - aboveSince >= config.triggerMs ? sample.ts : null,
  }
}

/**
 * What a pause that ran out heard in its last MEASURE_MS: nothing was said into it, so that is an honest measurement
 * of the room for the next window. Null when too few readings arrived.
 */
export function windowRoomDb(listening: Listening): number | null {
  return roomOf(listening.recent.map((sample) => sample.db))
}

function roomOf(readings: number[]): number | null {
  if (readings.length < MIN_MEASURED) {
    return null
  }

  return clampBaselineDb(median(readings))
}

function median(values: number[]): number {
  const sorted = [...values].sort((one, other) => one - other)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 1) {
    return sorted[middle]
  }

  return (sorted[middle - 1] + sorted[middle]) / 2
}
