import { describe, expect, test } from '@jest/globals'
import {
  DEFAULT_MARGIN_DB,
  type Detector,
  type DetectorConfig,
  feedLevel,
  isMeasured,
  MEASURE_MS,
  measuredRoomDb,
  openListening,
  thresholdDb,
  TRIGGER_MS,
} from '@/audio/vocalization'

const CONFIG: DetectorConfig = {
  marginDb: DEFAULT_MARGIN_DB,
  triggerMs: TRIGGER_MS,
}

/** Samples arrive every 50 ms, as the listener polls the recorder. */
const STEP_MS = 50

function feedFor(detector: Detector, from: number, durationMs: number, db: number | ((ts: number) => number)): Detector {
  let current = detector

  for (let ts = from; ts < from + durationMs; ts += STEP_MS) {
    current = feedLevel(current, { ts, db: typeof db === 'function' ? db(ts) : db }, CONFIG)
  }

  return current
}

/** A pause window: it opens with the room of the window before it, and measures alongside without ever going deafer. */
function window(baselineDb: number, roomDb: number, from = 0): Detector {
  return feedFor(openListening(baselineDb, from, MEASURE_MS, 'lowerOnly'), from, MEASURE_MS + STEP_MS, roomDb)
}

describe('openListening', () => {
  test('starts from the baseline it was given, with nothing measured yet', () => {
    const detector = openListening(-42, 0, MEASURE_MS, 'lowerOnly')

    expect(detector.baselineDb).toBe(-42)
    expect(isMeasured(detector)).toBe(false)
  })
})

describe('feedLevel', () => {
  test('listens from the first reading, against the baseline the window opened with', () => {
    const detector = openListening(-40, 0, MEASURE_MS, 'lowerOnly')
    const loud = thresholdDb(detector, CONFIG) + 1
    const after = feedFor(detector, 0, TRIGGER_MS + STEP_MS, loud)

    expect(isMeasured(after)).toBe(false)
    expect(after.vocalizedAt).toBe(TRIGGER_MS)
  })

  test('lets the opening measurement lower the baseline: a quieter room listens more readily', () => {
    const after = window(-40, -55)

    expect(isMeasured(after)).toBe(true)
    expect(after.baselineDb).toBe(-55)
  })

  test('never lets the opening measurement raise the baseline, in case the child spoke into it', () => {
    const after = window(-50, -20)

    expect(after.baselineDb).toBe(-50)
  })

  test('measures the room outright when nothing is going on', () => {
    const quiet = feedFor(openListening(-50, 0, MEASURE_MS, 'replace'), 0, MEASURE_MS + STEP_MS, -30)

    expect(quiet.baselineDb).toBe(-30)
  })

  test('takes the room as the median, ignoring a stray knock', () => {
    const after = feedFor(openListening(-20, 0, MEASURE_MS, 'replace'), 0, MEASURE_MS + STEP_MS, (ts) =>
      ts === 200 ? -3 : -45,
    )

    expect(after.baselineDb).toBe(-45)
  })

  test('reports a sound that holds above the threshold for the trigger time', () => {
    const detector = window(-40, -40)
    const loud = thresholdDb(detector, CONFIG) + 1
    const after = feedFor(detector, 1000, TRIGGER_MS + STEP_MS, loud)

    expect(after.vocalizedAt).toBe(1000 + TRIGGER_MS)
  })

  test('ignores a sound that is loud enough but too short', () => {
    const detector = window(-40, -40)
    const loud = thresholdDb(detector, CONFIG) + 6
    const after = feedFor(detector, 1000, TRIGGER_MS - STEP_MS, loud)

    expect(after.vocalizedAt).toBeNull()
    expect(after.aboveSince).toBe(1000)
  })

  test('starts counting again after the level falls back', () => {
    const detector = window(-40, -40)
    const loud = thresholdDb(detector, CONFIG) + 6
    const started = feedFor(detector, 1000, 100, loud)
    const dipped = feedLevel(started, { ts: 1100, db: -40 }, CONFIG)
    const after = feedFor(dipped, 1150, TRIGGER_MS, loud)

    expect(dipped.aboveSince).toBeNull()
    expect(after.aboveSince).toBe(1150)
    expect(after.vocalizedAt).toBeNull()
  })

  test('ignores a sound quieter than the margin above the room', () => {
    const detector = window(-40, -40)
    const after = feedFor(detector, 1000, 2000, thresholdDb(detector, CONFIG) - 1)

    expect(after.vocalizedAt).toBeNull()
  })

  test('keeps the loudest reading of the window', () => {
    const detector = feedFor(window(-40, -40), 1000, 200, (ts) => (ts === 1100 ? -12 : -38))

    expect(detector.peakDb).toBe(-12)
  })

  test('skips a reading the recorder could not give', () => {
    const detector = window(-40, -40)
    const after = feedLevel(detector, { ts: 1000, db: Number.NaN }, CONFIG)

    expect(after).toBe(detector)
  })

  test('keeps the first moment it recognised the child', () => {
    const detector = window(-40, -40)
    const loud = thresholdDb(detector, CONFIG) + 6
    const after = feedFor(detector, 1000, 1000, loud)

    expect(after.vocalizedAt).toBe(1000 + TRIGGER_MS)
  })
})

describe('measuredRoomDb', () => {
  test('is the median of the readings still kept, which a window nobody filled hands on', () => {
    const detector = feedFor(window(-50, -50), 1000, 5000, -34)

    expect(measuredRoomDb(detector)).toBe(-34)
  })

  test('forgets what it heard longer than the measurement ago', () => {
    const noisy = feedFor(window(-50, -50), 1000, 1000, -20)
    const quiet = feedFor(noisy, 2000, MEASURE_MS, -60)

    expect(measuredRoomDb(quiet)).toBe(-60)
  })

  test('is nothing at all when too few readings arrived', () => {
    const detector = feedLevel(openListening(-50, 0, MEASURE_MS, 'lowerOnly'), { ts: 0, db: -40 }, CONFIG)

    expect(measuredRoomDb(detector)).toBeNull()
  })
})
