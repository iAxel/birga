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

/**
 * What a measurement may do to the baseline. A quiet moment measures the room outright; the measurement that opens a
 * pause window may only lower it, because the child may be speaking into it, and a louder baseline would make the game
 * deaf exactly when it is meant to be listening.
 */
export type Measurement = 'replace' | 'lowerOnly'

export interface Detector {
  /** What the room measures. Every reading is judged against it, from the first one on. */
  baselineDb: number
  /** How the running measurement may change the baseline. */
  measurement: Measurement
  /** When the running measurement started, and how long it lasts; null once it has closed. */
  measuringSince: number | null
  measureMs: number
  measured: number[]
  /** The readings of the last MEASURE_MS, so a window nobody filled can hand the room on to the next one. */
  recent: LevelSample[]
  /** The loudest reading since the window opened; the development log prints it to help choose the margin. */
  peakDb: number
  /** Since when the level has stayed above the threshold without falling back. */
  aboveSince: number | null
  /** When the sound had lasted long enough to count; null until then, and set only once. */
  vocalizedAt: number | null
}

/** SPEC §3: 250 ms above the threshold is a vocalization. */
export const TRIGGER_MS = 250

/** SPEC §5: how far above the room counts, by default. */
export const DEFAULT_MARGIN_DB = 12

/** How much of the room is measured: at the opening of a pause window, and at the end of one nobody filled. */
export const MEASURE_MS = 500

/** The longer measurement the game takes while it waits on its play button, before any round has started. */
export const FIRST_MEASURE_MS = 2000

/** Fewer readings than this are not a measurement of anything. */
const MIN_MEASURED = 5

/** Until the microphone has heard anything, a quiet room is assumed; the first measurement replaces it. */
export const DEFAULT_BASELINE_DB = -50

/**
 * Opens a listening window. Deciding starts with the first reading, against the baseline the last window left: the
 * measurement that runs alongside only corrects it, so that the beginning of the pause is not a deaf spot.
 */
export function openListening(baselineDb: number, now: number, measureMs: number, measurement: Measurement): Detector {
  return {
    baselineDb,
    measurement,
    measuringSince: now,
    measureMs,
    measured: [],
    recent: [],
    peakDb: Number.NEGATIVE_INFINITY,
    aboveSince: null,
    vocalizedAt: null,
  }
}

/** Whether the measurement of the room has closed. */
export function isMeasured(detector: Detector): boolean {
  return detector.measuringSince === null
}

/** The level a sound has to pass to count as the child's. */
export function thresholdDb(detector: Detector, config: DetectorConfig): number {
  return detector.baselineDb + config.marginDb
}

/**
 * What the room measured over the readings still kept, or null when there are too few to trust. A pause that ran out
 * held nothing but the room, so its last MEASURE_MS are the honest measurement the next window starts from — and the
 * only way the baseline ever rises during a game.
 */
export function measuredRoomDb(detector: Detector): number | null {
  if (detector.recent.length < MIN_MEASURED) {
    return null
  }

  return median(detector.recent.map((sample) => sample.db))
}

/**
 * One reading further: it is kept for the measurements, and compared with the threshold. A sound that holds above the
 * threshold for triggerMs sets vocalizedAt once and for good.
 */
export function feedLevel(detector: Detector, sample: LevelSample, config: DetectorConfig): Detector {
  if (!Number.isFinite(sample.db)) {
    return detector
  }

  const heard = measure(
    {
      ...detector,
      recent: [...detector.recent, sample].filter((kept) => kept.ts > sample.ts - MEASURE_MS),
      peakDb: Math.max(detector.peakDb, sample.db),
    },
    sample,
  )

  if (heard.vocalizedAt !== null) {
    return heard
  }

  if (sample.db < thresholdDb(heard, config)) {
    return heard.aboveSince === null
      ? heard
      : {
          ...heard,
          aboveSince: null,
        }
  }

  const aboveSince = heard.aboveSince ?? sample.ts

  return {
    ...heard,
    aboveSince,
    vocalizedAt: sample.ts - aboveSince >= config.triggerMs ? sample.ts : null,
  }
}

/** The measurement closes once its time is up: the room is the median of what it heard, which ignores a stray knock. */
function measure(detector: Detector, sample: LevelSample): Detector {
  if (detector.measuringSince === null) {
    return detector
  }

  const measured = [...detector.measured, sample.db]

  if (sample.ts - detector.measuringSince < detector.measureMs) {
    return {
      ...detector,
      measured,
    }
  }

  const room = measured.length >= MIN_MEASURED ? median(measured) : detector.baselineDb

  return {
    ...detector,
    baselineDb: detector.measurement === 'replace' ? room : Math.min(detector.baselineDb, room),
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
