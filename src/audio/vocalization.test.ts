import { describe, expect, test } from '@jest/globals'
import {
  DEFAULT_MARGIN_DB,
  type Detector,
  type DetectorConfig,
  feedLevel,
  isMeasured,
  MEASURE_MS,
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

/** The room measured first, then the child: a listening window always starts with a measurement. */
function listening(roomDb: number, from = 0): Detector {
  return feedFor(openListening(-50, from, MEASURE_MS), from, MEASURE_MS + STEP_MS, roomDb)
}

describe('openListening', () => {
  test('keeps the baseline of the last measurement until a new one closes', () => {
    const detector = openListening(-42, 0, MEASURE_MS)

    expect(detector.baselineDb).toBe(-42)
    expect(isMeasured(detector)).toBe(false)
  })
})

describe('feedLevel', () => {
  test('takes the room as the median of the measurement, ignoring a stray knock', () => {
    const detector = feedLevel(
      feedFor(openListening(-50, 0, MEASURE_MS), 0, MEASURE_MS, -40),
      { ts: MEASURE_MS, db: -5 },
      CONFIG,
    )

    expect(isMeasured(detector)).toBe(true)
    expect(detector.baselineDb).toBe(-40)
  })

  test('counts nothing while the room is still being measured', () => {
    const detector = feedFor(openListening(-50, 0, MEASURE_MS), 0, MEASURE_MS, -10)

    expect(detector.vocalizedAt).toBeNull()
    expect(detector.aboveSince).toBeNull()
  })

  test('reports a sound that holds above the threshold for the trigger time', () => {
    const detector = listening(-40)
    const loud = thresholdDb(detector, CONFIG) + 1
    const after = feedFor(detector, 1000, TRIGGER_MS + STEP_MS, loud)

    expect(after.vocalizedAt).toBe(1000 + TRIGGER_MS)
  })

  test('ignores a sound that is loud enough but too short', () => {
    const detector = listening(-40)
    const loud = thresholdDb(detector, CONFIG) + 6
    const after = feedFor(detector, 1000, TRIGGER_MS - STEP_MS, loud)

    expect(after.vocalizedAt).toBeNull()
    expect(after.aboveSince).toBe(1000)
  })

  test('starts counting again after the level falls back', () => {
    const detector = listening(-40)
    const loud = thresholdDb(detector, CONFIG) + 6
    const started = feedFor(detector, 1000, 100, loud)
    const dipped = feedLevel(started, { ts: 1100, db: -40 }, CONFIG)
    const after = feedFor(dipped, 1150, TRIGGER_MS, loud)

    expect(dipped.aboveSince).toBeNull()
    expect(after.aboveSince).toBe(1150)
    expect(after.vocalizedAt).toBeNull()
  })

  test('ignores a sound quieter than the margin above the room', () => {
    const detector = listening(-40)
    const after = feedFor(detector, 1000, 2000, thresholdDb(detector, CONFIG) - 1)

    expect(after.vocalizedAt).toBeNull()
  })

  test('follows a room that has become noisier: the same sound no longer passes', () => {
    const quiet = listening(-50)
    const noisy = listening(-30)

    expect(thresholdDb(quiet, CONFIG)).toBe(-38)
    expect(thresholdDb(noisy, CONFIG)).toBe(-18)
    expect(feedFor(noisy, 1000, 1000, -35).vocalizedAt).toBeNull()
    expect(feedFor(quiet, 1000, 1000, -35).vocalizedAt).not.toBeNull()
  })

  test('skips a reading the recorder could not give', () => {
    const detector = listening(-40)
    const after = feedLevel(detector, { ts: 1000, db: Number.NaN }, CONFIG)

    expect(after).toBe(detector)
  })

  test('keeps the first moment it recognised the child', () => {
    const detector = listening(-40)
    const loud = thresholdDb(detector, CONFIG) + 6
    const after = feedFor(detector, 1000, 1000, loud)

    expect(after.vocalizedAt).toBe(1000 + TRIGGER_MS)
  })
})
