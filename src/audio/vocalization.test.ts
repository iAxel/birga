import { describe, expect, test } from '@jest/globals'
import {
  clampBaselineDb,
  DEFAULT_BASELINE_DB,
  DEFAULT_MARGIN_DB,
  type DetectorConfig,
  isMeasurementOver,
  type Listening,
  listenLevel,
  MEASURE_MS,
  measuredRoomDb,
  measureLevel,
  type Measurement,
  MIN_BASELINE_DB,
  startListening,
  startMeasurement,
  thresholdDb,
  TRIGGER_MS,
  windowRoomDb,
} from '@/audio/vocalization'

const CONFIG: DetectorConfig = {
  marginDb: DEFAULT_MARGIN_DB,
  triggerMs: TRIGGER_MS,
}

/** Samples arrive every 50 ms, as the listener polls the recorder. */
const STEP_MS = 50

type Level = number | ((ts: number) => number)

function levelAt(level: Level, ts: number): number {
  return typeof level === 'function' ? level(ts) : level
}

function listenFor(listening: Listening, from: number, durationMs: number, level: Level): Listening {
  let current = listening

  for (let ts = from; ts < from + durationMs; ts += STEP_MS) {
    current = listenLevel(current, { ts, db: levelAt(level, ts) }, CONFIG)
  }

  return current
}

function measureFor(measurement: Measurement, from: number, durationMs: number, level: Level): Measurement {
  let current = measurement

  for (let ts = from; ts < from + durationMs; ts += STEP_MS) {
    current = measureLevel(current, { ts, db: levelAt(level, ts) })
  }

  return current
}

/** A pause window whose first readings were the quiet room, so the detector is armed. */
function armedWindow(baselineDb: number): Listening {
  return listenFor(startListening(baselineDb), 0, 200, baselineDb)
}

describe('measurement', () => {
  test('takes the room as the median, ignoring a stray knock', () => {
    const measurement = measureFor(startMeasurement(0, 1000), 0, 1000, (ts) => (ts === 200 ? -3 : -45))

    expect(measuredRoomDb(measurement)).toBe(-45)
  })

  test('measures a loud room instead of taking it for the child', () => {
    const measurement = measureFor(startMeasurement(0, 2000), 0, 2000, -30)

    expect(isMeasurementOver(measurement, 2000)).toBe(true)
    expect(measuredRoomDb(measurement)).toBe(-30)
  })

  test('is over once its time is up and not before', () => {
    const measurement = startMeasurement(1000, 1000)

    expect(isMeasurementOver(measurement, 1999)).toBe(false)
    expect(isMeasurementOver(measurement, 2000)).toBe(true)
  })

  test('is nothing at all when too few readings arrived', () => {
    const measurement = measureFor(startMeasurement(0, 1000), 0, 4 * STEP_MS, -40)

    expect(measuredRoomDb(measurement)).toBeNull()
  })

  test('never believes in a room quieter than the floor, such as a recorder whose input has not started', () => {
    const measurement = measureFor(startMeasurement(0, 1000), 0, 1000, -160)

    expect(measuredRoomDb(measurement)).toBe(MIN_BASELINE_DB)
  })

  test('skips a reading the recorder could not give and keeps the loudest one', () => {
    const measurement = measureFor(startMeasurement(0, 1000), 0, 1000, (ts) => {
      if (ts === 100) {
        return Number.NaN
      }

      return ts === 300 ? -12 : -44
    })

    expect(measurement.readings).not.toContain(Number.NaN)
    expect(measurement.peakDb).toBe(-12)
  })
})

describe('listening', () => {
  test('listens from the first reading against the baseline it was given', () => {
    const listening = armedWindow(-40)
    const loud = thresholdDb(-40, CONFIG) + 1
    const after = listenFor(listening, 200, TRIGGER_MS + STEP_MS, loud)

    expect(after.vocalizedAt).toBe(200 + TRIGGER_MS)
  })

  test('counts only a rise: a level above the threshold from the first reading is the room, not the child', () => {
    const after = listenFor(startListening(DEFAULT_BASELINE_DB), 0, 5000, -36)

    expect(after.vocalizedAt).toBeNull()
    expect(after.isArmed).toBe(false)
  })

  test('counts a sound that rises once the level has fallen below the threshold', () => {
    const baseline = -40
    const loud = thresholdDb(baseline, CONFIG) + 4
    const dip = listenFor(listenFor(startListening(baseline), 0, 300, loud), 300, 100, baseline)
    const after = listenFor(dip, 400, TRIGGER_MS + STEP_MS, loud)

    expect(dip.isArmed).toBe(true)
    expect(after.vocalizedAt).toBe(400 + TRIGGER_MS)
  })

  test('ignores a sound that is loud enough but too short', () => {
    const loud = thresholdDb(-40, CONFIG) + 6
    const after = listenFor(armedWindow(-40), 1000, TRIGGER_MS - STEP_MS, loud)

    expect(after.vocalizedAt).toBeNull()
    expect(after.aboveSince).toBe(1000)
  })

  test('starts counting again after the level falls back', () => {
    const loud = thresholdDb(-40, CONFIG) + 6
    const started = listenFor(armedWindow(-40), 1000, 100, loud)
    const dipped = listenLevel(started, { ts: 1100, db: -40 }, CONFIG)
    const after = listenFor(dipped, 1150, TRIGGER_MS, loud)

    expect(dipped.aboveSince).toBeNull()
    expect(after.aboveSince).toBe(1150)
    expect(after.vocalizedAt).toBeNull()
  })

  test('ignores a sound quieter than the margin above the room', () => {
    const after = listenFor(armedWindow(-40), 1000, 2000, thresholdDb(-40, CONFIG) - 1)

    expect(after.vocalizedAt).toBeNull()
  })

  test('keeps the first moment it recognised the child', () => {
    const loud = thresholdDb(-40, CONFIG) + 6
    const after = listenFor(armedWindow(-40), 1000, 1000, loud)

    expect(after.vocalizedAt).toBe(1000 + TRIGGER_MS)
  })

  test('keeps the loudest reading of the window', () => {
    const after = listenFor(armedWindow(-40), 1000, 200, (ts) => (ts === 1100 ? -12 : -38))

    expect(after.peakDb).toBe(-12)
  })

  test('skips a reading the recorder could not give', () => {
    const listening = armedWindow(-40)

    expect(listenLevel(listening, { ts: 1000, db: Number.NaN }, CONFIG)).toBe(listening)
  })

  test('opens against a baseline no lower than the floor', () => {
    expect(startListening(-160).baselineDb).toBe(MIN_BASELINE_DB)
  })
})

describe('windowRoomDb', () => {
  test('is the median of the readings still kept, which a window nobody filled hands on', () => {
    const after = listenFor(armedWindow(-50), 200, 5000, -34)

    expect(windowRoomDb(after)).toBe(-34)
  })

  test('forgets what it heard longer than the measurement ago', () => {
    const noisy = listenFor(armedWindow(-50), 200, 1000, -20)
    const quiet = listenFor(noisy, 1200, MEASURE_MS, -60)

    expect(windowRoomDb(quiet)).toBe(-60)
  })

  test('is nothing at all when too few readings arrived', () => {
    const after = listenLevel(startListening(-50), { ts: 0, db: -40 }, CONFIG)

    expect(windowRoomDb(after)).toBeNull()
  })
})

describe('a room louder than a stale baseline', () => {
  test('does not fill the pause by itself, and the pause that runs out hands the real room on', () => {
    const room = -36
    const stale = startListening(DEFAULT_BASELINE_DB)
    const first = listenFor(stale, 0, 5000, room)
    const next = armedWindow(windowRoomDb(first) ?? DEFAULT_BASELINE_DB)

    expect(first.vocalizedAt).toBeNull()
    expect(windowRoomDb(first)).toBe(room)
    expect(listenFor(next, 200, 1000, room).vocalizedAt).toBeNull()
    expect(listenFor(next, 200, 1000, thresholdDb(room, CONFIG) + 3).vocalizedAt).not.toBeNull()
  })
})

describe('clampBaselineDb', () => {
  test('keeps a room level between the floor and the top of the range', () => {
    expect(clampBaselineDb(-160)).toBe(MIN_BASELINE_DB)
    expect(clampBaselineDb(-45)).toBe(-45)
    expect(clampBaselineDb(5)).toBe(0)
  })
})
