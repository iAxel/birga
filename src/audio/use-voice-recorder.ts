import { RecordingPresets } from 'expo-audio'
import { useEffect, useRef, useState } from 'react'
import { MAX_AUDIO_MS } from '@/audio/audio-file'
import { LEVEL_INTERVAL_MS, meteringLevel, trimLevels } from '@/audio/metering'
import { askForMicrophone, hasMicrophone } from '@/audio/microphone'
import { useTakeRecorder } from '@/audio/use-take-recorder'

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
   * Whether to ask for the microphone on mount. Child mode passes false: the system dialog belongs to parent mode,
   * which asks for the microphone when the parent starts a session. A permission already given is found here either
   * way, so the first hold of a session records.
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
 * The recorder goes through TakeRecorder, which prepares it for one take and never leaves it prepared: expo-audio
 * restarts every prepared recorder by itself when the app comes back to the foreground or an audio interruption ends,
 * and a recorder left ready, by a release that came while it was still being prepared, would then write the child to
 * disk with nobody asking for it. Preparing each take also gives it its own file.
 */
export function useVoiceRecorder(
  onRecorded: (uri: string, levels: number[], durationMs: number) => void,
  { askOnMount = true }: VoiceRecorderOptions = {},
): VoiceRecorder {
  const { recorder, takes } = useTakeRecorder(RECORDING_OPTIONS)
  const [access, setAccess] = useState<MicrophoneAccess>('pending')
  const [isRecording, setIsRecording] = useState(false)
  const [levels, setLevels] = useState<number[]>([])
  const [isRequested, setIsRequested] = useState(askOnMount)
  const levelsRef = useRef<number[]>([])
  const takeRef = useRef<Take | null>(null)

  /** What the app is allowed to do already, without asking anybody. */
  useEffect(() => {
    let isCurrent = true

    hasMicrophone().then((isAllowed) => {
      if (isCurrent && isAllowed) {
        setAccess('granted')
      }
    })

    return () => {
      isCurrent = false
    }
  }, [])

  useEffect(() => {
    if (!isRequested) {
      return
    }

    askForMicrophone().then((isAllowed) => setAccess(isAllowed ? 'granted' : 'denied'))
  }, [isRequested])

  /** A screen that goes away mid-take stops its clock; the take itself is thrown away with the recorder. */
  useEffect(() => {
    return () => {
      const take = takeRef.current

      takeRef.current = null

      if (take) {
        clearTimeout(take.timeout)
        clearInterval(take.meter)
      }
    }
  }, [])

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
    if (takeRef.current) {
      return false
    }

    if (access === 'denied') {
      return false
    }

    if (access !== 'granted') {
      setIsRequested(true)

      return false
    }

    takes.start().then((isStarted) => {
      if (isStarted) {
        beginTake()
      }
    })

    return true
  }

  function beginTake(): void {
    levelsRef.current = []
    takeRef.current = {
      startedAt: Date.now(),
      timeout: setTimeout(stop, MAX_RECORDING_MS),
      meter: setInterval(sampleLevel, LEVEL_INTERVAL_MS),
    }

    setLevels(levelsRef.current)
    setIsRecording(true)
  }

  /** Ends the take, or gives up the one still being prepared, which TakeRecorder then stops and deletes itself. */
  async function stop(): Promise<void> {
    const take = takeRef.current

    takeRef.current = null

    if (take) {
      clearTimeout(take.timeout)
      clearInterval(take.meter)
    }

    const uri = await takes.stop()

    if (!take) {
      return
    }

    setIsRecording(false)

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
