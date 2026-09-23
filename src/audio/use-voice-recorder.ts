import { RecordingPresets, requestRecordingPermissionsAsync, useAudioRecorder } from 'expo-audio'
import { useEffect, useRef, useState } from 'react'
import { LEVEL_INTERVAL_MS, meteringLevel } from '@/audio/metering'

/** Metering is on so the editor can draw the shape of the take (DESIGN §3, OVOZ). */
const RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
}

/** SPEC §5: a card recording lasts at most 4 s. */
export const MAX_RECORDING_MS = 4000

/** Anything shorter is a tap on the button, not a recording. */
const MIN_RECORDING_MS = 300

export type MicrophoneAccess = 'pending' | 'granted' | 'denied'

export interface VoiceRecorderOptions {
  /**
   * Whether to ask for the microphone on mount. Child mode passes false: the question belongs to the moment the parent
   * holds the corner, not to a screen the child is looking at. The first hold then only asks, and records from the next.
   */
  askOnMount?: boolean
}

export interface VoiceRecorder {
  access: MicrophoneAccess
  isRecording: boolean
  /** Loudness of the take so far, one value per LEVEL_INTERVAL_MS, for drawing it while it is spoken. */
  levels: number[]
  start(): boolean
  stop(): Promise<void>
}

interface Take {
  startedAt: number
  timeout: ReturnType<typeof setTimeout>
  meter: ReturnType<typeof setInterval>
}

/**
 * Hold-to-record: start on press-in, stop on release or after 4 s, and hand a usable take to onRecorded together with
 * the loudness sampled while it was spoken, and how long it lasted. Each take is prepared with explicit options, which
 * gives it a new file: without options expo-audio records over the previous take.
 */
export function useVoiceRecorder(
  onRecorded: (uri: string, levels: number[], durationMs: number) => void,
  { askOnMount = true }: VoiceRecorderOptions = {},
): VoiceRecorder {
  const recorder = useAudioRecorder(RECORDING_OPTIONS)
  const [access, setAccess] = useState<MicrophoneAccess>('pending')
  const [isRecording, setIsRecording] = useState(false)
  const [levels, setLevels] = useState<number[]>([])
  const levelsRef = useRef<number[]>([])
  const [isRequested, setIsRequested] = useState(askOnMount)
  const takeRef = useRef<Take | null>(null)
  const isPreparedRef = useRef(false)

  useEffect(() => {
    return () => {
      clearTimeout(takeRef.current?.timeout)
      clearInterval(takeRef.current?.meter)
    }
  }, [])

  useEffect(() => {
    if (!isRequested) {
      return
    }

    async function prepareFirstTake(): Promise<void> {
      const permission = await requestRecordingPermissionsAsync()

      setAccess(permission.granted ? 'granted' : 'denied')

      if (!permission.granted) {
        return
      }

      await recorder.prepareToRecordAsync(RECORDING_OPTIONS)

      isPreparedRef.current = true
    }

    prepareFirstTake()
  }, [isRequested, recorder])

  /** The readings live in a ref, which stop() reads, and in state, which draws them while the parent speaks. */
  function sampleLevel(): void {
    levelsRef.current = [...levelsRef.current, meteringLevel(recorder.getStatus().metering ?? Number.NaN)]

    setLevels(levelsRef.current)
  }

  /**
   * Returns false when there is nothing to record into yet: no permission, or the next file is still being prepared.
   * A recorder that did not ask on mount asks here, so the first hold only brings up the question.
   */
  function start(): boolean {
    if (!isPreparedRef.current) {
      if (access !== 'denied') {
        setIsRequested(true)
      }

      return false
    }

    if (takeRef.current) {
      return false
    }

    recorder.record()

    takeRef.current = {
      startedAt: Date.now(),
      timeout: setTimeout(stop, MAX_RECORDING_MS),
      meter: setInterval(sampleLevel, LEVEL_INTERVAL_MS),
    }

    levelsRef.current = []

    setLevels(levelsRef.current)
    setIsRecording(true)

    return true
  }

  async function stop(): Promise<void> {
    const take = takeRef.current

    if (!take) {
      return
    }

    takeRef.current = null
    isPreparedRef.current = false
    clearTimeout(take.timeout)
    clearInterval(take.meter)

    await recorder.stop()

    setIsRecording(false)

    const uri = recorder.uri
    const durationMs = Date.now() - take.startedAt

    await recorder.prepareToRecordAsync(RECORDING_OPTIONS)

    isPreparedRef.current = true

    if (uri && durationMs >= MIN_RECORDING_MS) {
      onRecorded(uri, takeLevels(durationMs), durationMs)
    }
  }

  /** One level per interval of the take: the readings taken, trimmed or padded to the length it actually lasted. */
  function takeLevels(durationMs: number): number[] {
    const wanted = Math.max(1, Math.round(durationMs / LEVEL_INTERVAL_MS))

    return Array.from({ length: wanted }, (_, index) => levelsRef.current[index] ?? 0)
  }

  return {
    access,
    isRecording,
    levels,
    start,
    stop,
  }
}
