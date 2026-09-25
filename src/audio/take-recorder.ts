import type { RecordingOptions } from 'expo-audio'

/** The part of expo-audio's AudioRecorder a take uses, so its life cycle can be tested without a microphone. */
export interface Microphone {
  readonly uri: string | null
  prepareToRecordAsync(options: Partial<RecordingOptions>): Promise<void>
  record(): void
  stop(): Promise<void>
  getStatus(): {
    isRecording: boolean
    /** True while the recorder is prepared, recording or paused: every state expo-audio may resume by itself. */
    canRecord: boolean
  }
}

/**
 * One recorder's takes, one at a time: prepare, record, stop. expo-audio starts every recorder it finds prepared or
 * paused when the app comes back to the foreground or an audio interruption ends, so a take given up while it was
 * being prepared is recorded and stopped at once and its file deleted: the recorder is never left prepared, and nothing
 * records the child with nobody asking. Every call waits for the one before it, so a prepare never overlaps a record
 * or a stop, and the file of a take is known by its path from the moment it exists.
 */
export class TakeRecorder {
  readonly #_microphone: Microphone
  readonly #_options: Partial<RecordingOptions>
  readonly #_deleteFile: (uri: string) => void
  #_queue: Promise<unknown> = Promise.resolve()
  #_generation = 0
  #_takeUri: string | null = null
  #_isRecording = false
  #_isDetached = false

  constructor(microphone: Microphone, options: Partial<RecordingOptions>, deleteFile: (uri: string) => void) {
    this.#_microphone = microphone
    this.#_options = options
    this.#_deleteFile = deleteFile
  }

  /** Starts a take: true once the microphone records, false when the take was given up or could not begin. */
  start(): Promise<boolean> {
    this.#_generation++

    const generation = this.#_generation

    return this.#_enqueue(() => this.#_begin(generation), false)
  }

  /** Ends the take and hands its file over, or null when it never began; the file is the caller's from then on. */
  stop(): Promise<string | null> {
    this.#_generation++

    return this.#_enqueue(() => this.#_end(), null)
  }

  /** Ends the take and deletes its file: what the microphone heard leaves no trace. */
  async discard(): Promise<void> {
    this.#_deleteTake(await this.stop())
  }

  /**
   * Called when the app is active again: a recorder that records, or stands prepared, while no take runs was started
   * by expo-audio on its own. It is stopped and what it wrote is deleted.
   */
  audit(): Promise<void> {
    return this.#_enqueue(() => this.#_auditNow(), undefined)
  }

  /**
   * The screen is gone: the file of a take in progress is deleted by its path, and no take starts until the screen
   * attaches the recorder again. expo-audio has usually released the recorder with the screen already; one that is
   * still alive, as after a Fast Refresh, is brought to a stop.
   */
  detach(): void {
    this.#_isDetached = true
    this.#_generation++
    this.#_isRecording = false

    this.#_deleteTake(this.#_takeUri)

    this.#_takeUri = null

    this.#_enqueue(() => this.#_silence(), undefined)
  }

  /** The screen is there again, which in a development build happens after every Fast Refresh: takes may start. */
  attach(): void {
    this.#_isDetached = false
  }

  async #_begin(generation: number): Promise<boolean> {
    if (this.#_isRecording || !this.#_isCurrent(generation)) {
      return false
    }

    try {
      await this.#_microphone.prepareToRecordAsync(this.#_options)
    } catch {
      return false
    }

    const uri = this.#_readUri()

    if (!this.#_isCurrent(generation)) {
      await this.#_retire(uri)

      return false
    }

    try {
      this.#_microphone.record()
    } catch {
      await this.#_retire(uri)

      return false
    }

    this.#_isRecording = true
    this.#_takeUri = uri

    return true
  }

  async #_end(): Promise<string | null> {
    if (!this.#_isRecording) {
      return null
    }

    const uri = this.#_takeUri

    this.#_isRecording = false
    this.#_takeUri = null

    try {
      await this.#_microphone.stop()
    } catch {
      this.#_deleteTake(uri)

      return null
    }

    return uri
  }

  async #_auditNow(): Promise<void> {
    if (this.#_isRecording || this.#_isDetached) {
      return
    }

    const status = this.#_readStatus()

    if (!status || (!status.isRecording && !status.canRecord)) {
      return
    }

    await this.#_retire(this.#_readUri())
  }

  /** A recorder that must not stay prepared or recording: stopped from wherever it stands, and its file deleted. */
  async #_retire(uri: string | null): Promise<void> {
    await this.#_silence()

    this.#_deleteTake(uri)
  }

  /** Brings the recorder to a stop, the one state expo-audio never resumes by itself; a prepared one records first. */
  async #_silence(): Promise<void> {
    try {
      if (!this.#_microphone.getStatus().isRecording) {
        this.#_microphone.record()
      }

      await this.#_microphone.stop()
    } catch {
      return
    }
  }

  #_deleteTake(uri: string | null): void {
    if (uri) {
      this.#_deleteFile(uri)
    }
  }

  #_isCurrent(generation: number): boolean {
    return generation === this.#_generation && !this.#_isDetached
  }

  #_readUri(): string | null {
    try {
      return this.#_microphone.uri
    } catch {
      return null
    }
  }

  #_readStatus(): ReturnType<Microphone['getStatus']> | null {
    try {
      return this.#_microphone.getStatus()
    } catch {
      return null
    }
  }

  /** Runs the task after every task before it; a task that fails resolves with the fallback and holds nothing up. */
  #_enqueue<T>(task: () => Promise<T>, fallback: T): Promise<T> {
    const run = this.#_queue.then(task).catch(() => fallback)

    this.#_queue = run

    return run
  }
}
