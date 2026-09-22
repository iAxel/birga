import { RecordingPresets, requestRecordingPermissionsAsync, useAudioRecorder } from 'expo-audio'
import { useEffect, useRef, useState } from 'react'

const RECORDING_OPTIONS = RecordingPresets.HIGH_QUALITY

/** SPEC §5: a card recording lasts at most 4 s. */
export const MAX_RECORDING_MS = 4000

/** Anything shorter is a tap on the button, not a recording. */
const MIN_RECORDING_MS = 300

export type MicrophoneAccess = 'pending' | 'granted' | 'denied'

export interface VoiceRecorder {
  access: MicrophoneAccess
  isRecording: boolean
  start(): boolean
  stop(): Promise<void>
}

interface Take {
  startedAt: number
  timeout: ReturnType<typeof setTimeout>
}

/**
 * Hold-to-record: start on press-in, stop on release or after 4 s, and hand a usable take to onRecorded. Each take is
 * prepared with explicit options, which gives it a new file: without options expo-audio records over the previous take.
 */
export function useVoiceRecorder(onRecorded: (uri: string) => void): VoiceRecorder {
  const recorder = useAudioRecorder(RECORDING_OPTIONS)
  const [access, setAccess] = useState<MicrophoneAccess>('pending')
  const [isRecording, setIsRecording] = useState(false)
  const takeRef = useRef<Take | null>(null)
  const isPreparedRef = useRef(false)

  useEffect(() => {
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

    return () => {
      clearTimeout(takeRef.current?.timeout)
    }
  }, [recorder])

  /** Returns false when there is nothing to record into yet: no permission or the next file is still being prepared. */
  function start(): boolean {
    if (!isPreparedRef.current || takeRef.current) {
      return false
    }

    recorder.record()

    takeRef.current = {
      startedAt: Date.now(),
      timeout: setTimeout(stop, MAX_RECORDING_MS),
    }

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

    await recorder.stop()

    setIsRecording(false)

    const uri = recorder.uri
    const durationMs = Date.now() - take.startedAt

    await recorder.prepareToRecordAsync(RECORDING_OPTIONS)

    isPreparedRef.current = true

    if (uri && durationMs >= MIN_RECORDING_MS) {
      onRecorded(uri)
    }
  }

  return {
    access,
    isRecording,
    start,
    stop,
  }
}
