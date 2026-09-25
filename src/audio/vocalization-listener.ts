import type { TakeRecorder } from '@/audio/take-recorder'
import {
  clampBaselineDb,
  DEFAULT_BASELINE_DB,
  DEFAULT_MARGIN_DB,
  type DetectorConfig,
  isMeasurementOver,
  type LevelSample,
  type Listening,
  listenLevel,
  measuredRoomDb,
  measureLevel,
  type Measurement,
  startListening,
  startMeasurement,
  thresholdDb,
  TRIGGER_MS,
  windowRoomDb,
} from '@/audio/vocalization'

/** How often the level is read. Five readings fit into the 250 ms a vocalization has to last. */
const SAMPLE_MS = 50

/** The part of expo-audio's recorder the listener reads: how loud the microphone hears the room right now. */
export interface Meter {
  getStatus(): {
    metering?: number
  }
}

/** What an open microphone is doing: measuring the room in a quiet moment, or listening for the child in a pause. */
type Hearing =
  | {
      kind: 'measure'
      measurement: Measurement
    }
  | {
      kind: 'listen'
      listening: Listening
      onVocalized: (at: number) => void
    }

/**
 * The microphone side of the pause game (SPEC §3). It opens once the app is silent, judges the level against the room,
 * and closes before the app speaks again; what it heard is never kept. expo-audio records to a file whether we want
 * one or not, so the take is deleted the moment the microphone closes: the detector keeps metering only, as CLAUDE.md
 * requires. The room is measured only in the app's quiet moments, and every new measurement is handed on to be kept
 * for the next session.
 */
export class VocalizationListener {
  readonly #_takes: TakeRecorder
  readonly #_meter: Meter
  #_config: DetectorConfig = {
    marginDb: DEFAULT_MARGIN_DB,
    triggerMs: TRIGGER_MS,
  }
  #_baselineDb = DEFAULT_BASELINE_DB
  #_onRoomMeasured: (db: number) => void = () => undefined
  #_isAllowed = false
  #_window: object | null = null
  #_hearing: Hearing | null = null
  #_interval: ReturnType<typeof setInterval> | null = null

  constructor(takes: TakeRecorder, meter: Meter) {
    this.#_takes = takes
    this.#_meter = meter
  }

  /** How far above the room a sound has to be to count as the child's; the parent may change it in the settings. */
  setMargin(marginDb: number): void {
    this.#_config = {
      marginDb,
      triggerMs: TRIGGER_MS,
    }
  }

  /** The room as the last measurement left it, kept between sessions; null before the first one changes nothing. */
  setRoom(roomDb: number | null): void {
    if (roomDb !== null) {
      this.#_baselineDb = clampBaselineDb(roomDb)
    }
  }

  /** Whether the parent allowed the microphone; without it nothing opens, and pauses end on the timer or the button. */
  allow(isAllowed: boolean): void {
    this.#_isAllowed = isAllowed
  }

  /** Where every new measurement of the room goes, to be kept for the next session. */
  keepRoomWith(onRoomMeasured: (db: number) => void): void {
    this.#_onRoomMeasured = onRoomMeasured
  }

  /**
   * Listens for the child from the first reading on, against the room the last measurement left; onVocalized fires
   * once, and the microphone closes with it.
   */
  listen(onVocalized: (at: number) => void): void {
    this.#_open(() => ({
      kind: 'listen',
      listening: startListening(this.#_baselineDb),
      onVocalized,
    }))
  }

  /** Measures the room while the app is silent, then closes the microphone. Nothing it hears counts as the child. */
  measure(measureMs: number): void {
    this.#_open((now) => ({
      kind: 'measure',
      measurement: startMeasurement(now, measureMs),
    }))
  }

  /** Nothing filled the window that is closing: what its last half second heard is the room from now on. */
  settle(): void {
    const hearing = this.#_hearing

    if (hearing?.kind !== 'listen') {
      return
    }

    const room = windowRoomDb(hearing.listening)

    if (room === null) {
      return
    }

    logHearing('nothing in the pause', {
      baseline: this.#_baselineDb,
      room,
      peak: hearing.listening.peakDb,
    })

    this.#_adopt(room)
  }

  /** What the microphone heard leaves no trace: TakeRecorder stops it and deletes the file expo-audio wrote. */
  close(): void {
    if (this.#_window === null) {
      return
    }

    this.#_window = null
    this.#_hearing = null

    if (this.#_interval !== null) {
      clearInterval(this.#_interval)

      this.#_interval = null
    }

    this.#_takes.discard()
  }

  /** Opens the microphone for one window; readings start once it records, and a window closed sooner hears nothing. */
  #_open(begin: (now: number) => Hearing): void {
    if (!this.#_isAllowed || this.#_window !== null) {
      return
    }

    const opened = {}

    this.#_window = opened

    this.#_takes.start().then((isRecording) => {
      if (!isRecording || this.#_window !== opened) {
        return
      }

      this.#_hearing = begin(Date.now())
      this.#_interval = setInterval(() => this.#_sample(), SAMPLE_MS)
    })
  }

  #_sample(): void {
    const hearing = this.#_hearing

    if (!hearing) {
      return
    }

    const reading = {
      ts: Date.now(),
      db: this.#_meter.getStatus().metering ?? Number.NaN,
    }

    if (hearing.kind === 'measure') {
      this.#_sampleMeasurement(hearing.measurement, reading)

      return
    }

    this.#_sampleListening(hearing, reading)
  }

  #_sampleMeasurement(measurement: Measurement, reading: LevelSample): void {
    const next = measureLevel(measurement, reading)

    this.#_hearing = {
      kind: 'measure',
      measurement: next,
    }

    if (!isMeasurementOver(next, reading.ts)) {
      return
    }

    const room = measuredRoomDb(next)

    logHearing('measured the room', {
      baseline: room ?? this.#_baselineDb,
      peak: next.peakDb,
    })

    if (room !== null) {
      this.#_adopt(room)
    }

    this.close()
  }

  #_sampleListening(hearing: Extract<Hearing, { kind: 'listen' }>, reading: LevelSample): void {
    const next = listenLevel(hearing.listening, reading, this.#_config)

    this.#_hearing = {
      ...hearing,
      listening: next,
    }

    if (next.vocalizedAt === null) {
      return
    }

    const at = next.vocalizedAt

    logHearing('heard the child', {
      baseline: next.baselineDb,
      threshold: thresholdDb(next.baselineDb, this.#_config),
      peak: next.peakDb,
    })

    this.close()

    hearing.onVocalized(at)
  }

  #_adopt(db: number): void {
    this.#_baselineDb = db

    this.#_onRoomMeasured(db)
  }
}

/**
 * Development only: the numbers the margin has to be chosen against, which can only be learnt in the room the child is
 * actually in. A release build prints nothing.
 */
function logHearing(what: string, values: Record<string, number>): void {
  if (!__DEV__) {
    return
  }

  const printed = Object.entries(values)
    .map(([name, value]) => `${name} ${Number.isFinite(value) ? value.toFixed(1) : '?'} dB`)
    .join(', ')

  console.log(`[detector] ${what}: ${printed}`)
}
