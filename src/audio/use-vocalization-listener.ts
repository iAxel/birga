import { RecordingPresets, useAudioRecorder } from 'expo-audio'
import { File } from 'expo-file-system'
import { useEffect, useMemo, useRef } from 'react'
import { hasMicrophone } from '@/audio/microphone'
import {
  DEFAULT_BASELINE_DB,
  type Detector,
  type DetectorConfig,
  feedLevel,
  isMeasured,
  openListening,
  TRIGGER_MS,
} from '@/audio/vocalization'

/** Low quality is enough for loudness, and keeps the take the recorder writes as small as possible. */
const LISTENING_OPTIONS = {
  ...RecordingPresets.LOW_QUALITY,
  isMeteringEnabled: true,
}

/** How often the level is read. Five readings fit into the 250 ms a vocalization has to last. */
const SAMPLE_MS = 50

export interface VocalizationListener {
  /** Measures the room for measureMs, then listens; onVocalized fires once, and the microphone closes with it. */
  listen: (measureMs: number, onVocalized: (at: number) => void) => void
  /** Measures the room and closes the microphone again, without listening for anything. */
  measure: (measureMs: number) => void
  close: () => void
}

/**
 * The microphone side of the pause game (SPEC §3). It opens only when the app is silent, measures the room, and then
 * watches the level for a sound of the child; what it heard is never kept. expo-audio records to a file whether we
 * want one or not, so the take is deleted the moment the microphone closes: the detector keeps metering only, as
 * CLAUDE.md requires.
 */
export function useVocalizationListener(marginDb: number): VocalizationListener {
  const recorder = useAudioRecorder(LISTENING_OPTIONS)
  const detectorRef = useRef<Detector | null>(null)
  const baselineRef = useRef(DEFAULT_BASELINE_DB)
  const meterRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isOpenRef = useRef(false)
  const isAllowedRef = useRef(false)
  const onVocalizedRef = useRef<((at: number) => void) | null>(null)
  const configRef = useRef<DetectorConfig>({
    marginDb,
    triggerMs: TRIGGER_MS,
  })

  useEffect(() => {
    configRef.current = {
      marginDb,
      triggerMs: TRIGGER_MS,
    }
  }, [marginDb])

  /** Whether the parent allowed the microphone when the session started; this screen never asks by itself. */
  useEffect(() => {
    let isCurrent = true

    hasMicrophone().then((isAllowed) => {
      if (isCurrent) {
        isAllowedRef.current = isAllowed
      }
    })

    return () => {
      isCurrent = false
    }
  }, [])

  return useMemo(() => {
    function close(): void {
      if (!isOpenRef.current) {
        return
      }

      isOpenRef.current = false
      detectorRef.current = null
      onVocalizedRef.current = null

      if (meterRef.current !== null) {
        clearInterval(meterRef.current)

        meterRef.current = null
      }

      recorder.stop().then(discard, discard)
    }

    /** What the microphone heard leaves no trace: the file expo-audio wrote goes as soon as it is closed. */
    function discard(): void {
      const uri = recorder.uri

      if (!uri) {
        return
      }

      try {
        const take = new File(uri)

        if (take.exists) {
          take.delete()
        }
      } catch {
        return
      }
    }

    function sample(): void {
      const detector = detectorRef.current

      if (!detector) {
        return
      }

      const next = feedLevel(
        detector,
        {
          ts: Date.now(),
          db: recorder.getStatus().metering ?? Number.NaN,
        },
        configRef.current,
      )

      detectorRef.current = next
      baselineRef.current = next.baselineDb

      if (next.vocalizedAt !== null) {
        const onVocalized = onVocalizedRef.current
        const at = next.vocalizedAt

        close()
        onVocalized?.(at)

        return
      }

      if (onVocalizedRef.current === null && isMeasured(next)) {
        close()
      }
    }

    async function open(measureMs: number, onVocalized: ((at: number) => void) | null): Promise<void> {
      if (!isAllowedRef.current || isOpenRef.current) {
        return
      }

      isOpenRef.current = true
      onVocalizedRef.current = onVocalized

      try {
        await recorder.prepareToRecordAsync(LISTENING_OPTIONS)
      } catch {
        isOpenRef.current = false
        onVocalizedRef.current = null

        return
      }

      if (!isOpenRef.current) {
        return
      }

      recorder.record()

      detectorRef.current = openListening(baselineRef.current, Date.now(), measureMs)
      meterRef.current = setInterval(sample, SAMPLE_MS)
    }

    return {
      listen: (measureMs, onVocalized) => {
        open(measureMs, onVocalized)
      },
      measure: (measureMs) => {
        open(measureMs, null)
      },
      close,
    }
  }, [recorder])
}
