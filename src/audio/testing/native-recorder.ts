import type { Microphone } from '@/audio/take-recorder'

export type NativeState = 'idle' | 'prepared' | 'recording' | 'paused' | 'stopped'

/**
 * The recorder as expo-audio's iOS code behaves: prepare makes a new file, stop acts only on a recording or paused
 * recorder, and on return to the foreground every prepared or paused recorder starts recording by itself.
 */
export class NativeRecorder implements Microphone {
  state: NativeState = 'idle'
  uri: string | null = null
  readonly files = new Set<string>()
  readonly waitingPrepares: (() => void)[] = []
  prepares = 0
  holdsPrepare = false
  failsPrepare = false
  isReleased = false
  /** What the microphone hears right now, in dBFS, as metering reports it while recording. */
  metering = -50

  prepareToRecordAsync(): Promise<void> {
    this.#_assertAlive()

    if (this.failsPrepare) {
      return Promise.reject(new Error('PREPARE_FAILED'))
    }

    return new Promise((resolve) => {
      const finish = (): void => {
        if (this.state === 'recording') {
          this.state = 'stopped'
        }

        this.prepares++
        this.uri = `file:///Caches/ExpoAudio/recording-${this.prepares}.m4a`
        this.files.add(this.uri)
        this.state = 'prepared'

        resolve()
      }

      if (this.holdsPrepare) {
        this.waitingPrepares.push(finish)

        return
      }

      finish()
    })
  }

  record(): void {
    this.#_assertAlive()

    if (this.state === 'prepared' || this.state === 'paused') {
      this.state = 'recording'
    }
  }

  async stop(): Promise<void> {
    this.#_assertAlive()

    if (this.state === 'recording' || this.state === 'paused') {
      this.state = 'stopped'
    }
  }

  getStatus(): { isRecording: boolean; canRecord: boolean; metering?: number } {
    this.#_assertAlive()

    return {
      isRecording: this.state === 'recording',
      canRecord: this.state === 'prepared' || this.state === 'recording' || this.state === 'paused',
      metering: this.state === 'recording' ? this.metering : undefined,
    }
  }

  /** What expo-audio does by itself on return to the foreground or when an audio interruption ends. */
  resumeByItself(): void {
    if (this.state === 'prepared' || this.state === 'paused') {
      this.state = 'recording'
    }
  }

  releasePrepare(): void {
    this.waitingPrepares.shift()?.()
  }

  #_assertAlive(): void {
    if (this.isReleased) {
      throw new Error('NATIVE_SHARED_OBJECT_NOT_FOUND')
    }
  }
}
