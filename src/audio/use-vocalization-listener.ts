import { RecordingPresets } from 'expo-audio'
import { useEffect, useMemo } from 'react'
import { hasMicrophone } from '@/audio/microphone'
import { useTakeRecorder } from '@/audio/use-take-recorder'
import { VocalizationListener } from '@/audio/vocalization-listener'

/** Low quality is enough for loudness, and keeps the take the recorder writes as small as possible. */
const LISTENING_OPTIONS = {
  ...RecordingPresets.LOW_QUALITY,
  isMeteringEnabled: true,
}

/**
 * The pause game's microphone for as long as the screen lives (SPEC §3). The room starts from `roomDb`, what the last
 * session measured, and every new measurement is handed to onRoomMeasured to be kept for the next one. The screen
 * never asks for the microphone itself: without the parent's permission nothing opens.
 */
export function useVocalizationListener(
  marginDb: number,
  roomDb: number | null,
  onRoomMeasured: (db: number) => void,
): VocalizationListener {
  const { recorder, takes } = useTakeRecorder(LISTENING_OPTIONS)
  const listener = useMemo(() => new VocalizationListener(takes, recorder), [takes, recorder])

  useEffect(() => {
    listener.setMargin(marginDb)
  }, [listener, marginDb])

  useEffect(() => {
    listener.setRoom(roomDb)
  }, [listener, roomDb])

  useEffect(() => {
    listener.keepRoomWith(onRoomMeasured)
  }, [listener, onRoomMeasured])

  useEffect(() => {
    let isCurrent = true

    hasMicrophone().then((isAllowed) => {
      if (isCurrent) {
        listener.allow(isAllowed)
      }
    })

    return () => {
      isCurrent = false
    }
  }, [listener])

  return listener
}
