import { type AudioRecorder, type RecordingOptions, useAudioRecorder } from 'expo-audio'
import { useEffect, useMemo } from 'react'
import { AppState } from 'react-native'
import { TakeRecorder } from '@/audio/take-recorder'
import { deleteTake } from '@/audio/takes'

/** An audio interruption may end, and expo-audio resume its recorders, a moment after the app is active again. */
const RECHECK_MS = 1000

export interface TakeRecording {
  /** The recorder itself, for reading its metering while a take runs. */
  recorder: AudioRecorder
  takes: TakeRecorder
}

/**
 * A recorder whose takes go through TakeRecorder, so it is never left prepared. Whenever the app becomes active, and
 * again a moment later, it is checked for a recording nobody asked for, which expo-audio starts by itself after an
 * interruption or a return to the foreground, and after the system reset its media services. When the screen goes,
 * the take in progress is deleted by its path.
 */
export function useTakeRecorder(options: RecordingOptions): TakeRecording {
  const recorder = useAudioRecorder(options)
  const takes = useMemo(() => new TakeRecorder(recorder, options, deleteTake), [recorder, options])

  useEffect(() => {
    let recheck: ReturnType<typeof setTimeout> | undefined

    takes.attach()

    const appState = AppState.addEventListener('change', (next) => {
      if (next !== 'active') {
        return
      }

      takes.audit()

      clearTimeout(recheck)

      recheck = setTimeout(() => takes.audit(), RECHECK_MS)
    })

    const status = recorder.addListener('recordingStatusUpdate', (update) => {
      if (update.mediaServicesDidReset) {
        takes.audit()
      }
    })

    return () => {
      clearTimeout(recheck)

      appState.remove()
      status.remove()

      takes.detach()
    }
  }, [recorder, takes])

  return {
    recorder,
    takes,
  }
}
