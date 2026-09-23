import { RecordingPresets, requestRecordingPermissionsAsync, useAudioRecorder } from 'expo-audio'
import { useEffect, useRef, useState } from 'react'
import { MAX_AUDIO_MS } from '@/audio/audio-file'
import { LEVEL_INTERVAL_MS, meteringLevel, trimLevels } from '@/audio/metering'

/** Metering is on so the editor can draw the shape of the take (DESIGN §3, OVOZ). */
const RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
}

/** A recording lasts as long as an imported file may: SPEC §5 allows 4 s either way. */
export const MAX_RECORDING_MS = MAX_AUDIO_MS

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
 * the loudness sampled while it was spoken, and how long it lasted.
 *
 * The microphone is prepared for one take and left unprepared afterwards, which is what keeps it cold: expo-audio
 * restarts every prepared recorder by itself when an audio interruption ends (a call, Siri), and a recorder left ready
 * on the child's screen would then write the child to disk with nobody asking for it. Preparing each take also gives it
 * its own file: without explicit options expo-audio records over the previous one.
 */
export function useVoiceRecorder(
  onRecorded: (uri: string, levels: number[], durationMs: number) => void,
  { askOnMount = true }: VoiceRecorderOptions = {},
): VoiceRecorder {
  const recorder = useAudioRecorder(RECORDING_OPTIONS)
  const [access, setAccess] = useState<MicrophoneAccess>('pending')
  const [isRecording, setIsRecording] = useState(false)
  const [levels, setLevels] = useState<number[]>([])
  const [isRequested, setIsRequested] = useState(askOnMount)
  const levelsRef = useRef<number[]>([])
  const takeRef = useRef<Take | null>(null)
  const isWantedRef = useRef(false)

  useEffect(() => {
    if (!isRequested) {
      return
    }

    requestRecordingPermissionsAsync().then(
      (permission) => setAccess(permission.granted ? 'granted' : 'denied'),
      () => setAccess('denied'),
    )
  }, [isRequested])

  /** A screen that goes away mid-take takes the microphone with it, rather than leaving it open. */
  useEffect(() => {
    return () => {
      const take = takeRef.current

      isWantedRef.current = false
      takeRef.current = null

      if (take) {
        clearTimeout(take.timeout)
        clearInterval(take.meter)

        recorder.stop().catch(() => undefined)
      }
    }
  }, [recorder])

  /** The readings live in a ref, which stop() reads, and in state, which draws them while the parent speaks. */
  function sampleLevel(): void {
    levelsRef.current = [...levelsRef.current, meteringLevel(recorder.getStatus().metering ?? Number.NaN)]

    setLevels(levelsRef.current)
  }

  /**
   * Returns false when nothing will be recorded this time: no permission yet, in which case the question comes up now
   * and the next hold records, or the microphone was refused.
   */
  function start(): boolean {
    if (takeRef.current || isWantedRef.current) {
      return false
    }

    if (access === 'denied') {
      return false
    }

    if (access !== 'granted') {
      setIsRequested(true)

      return false
    }

    isWantedRef.current = true

    beginTake()

    return true
  }

  async function beginTake(): Promise<void> {
    try {
      await recorder.prepareToRecordAsync(RECORDING_OPTIONS)
    } catch {
      isWantedRef.current = false

      return
    }

    if (!isWantedRef.current) {
      return
    }

    recorder.record()

    levelsRef.current = []
    takeRef.current = {
      startedAt: Date.now(),
      timeout: setTimeout(stop, MAX_RECORDING_MS),
      meter: setInterval(sampleLevel, LEVEL_INTERVAL_MS),
    }

    setLevels(levelsRef.current)
    setIsRecording(true)
  }

  async function stop(): Promise<void> {
    isWantedRef.current = false

    const take = takeRef.current

    if (!take) {
      return
    }

    takeRef.current = null

    clearTimeout(take.timeout)
    clearInterval(take.meter)

    await recorder.stop()

    setIsRecording(false)

    const uri = recorder.uri
    const durationMs = Date.now() - take.startedAt

    if (uri && durationMs >= MIN_RECORDING_MS) {
      onRecorded(uri, trimLevels(levelsRef.current, durationMs), durationMs)
    }
  }

  return {
    access,
    isRecording,
    levels,
    start,
    stop,
  }
}
