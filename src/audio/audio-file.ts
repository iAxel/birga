import { createAudioPlayer } from 'expo-audio'
import { getDocumentAsync } from 'expo-document-picker'

/** SPEC §5: a recording of a card or a sequence item lasts at most 4 s, an imported file too. */
export const MAX_AUDIO_MS = 4000

/** File types the parent may import: what a phone records or receives in a message. */
const AUDIO_TYPES = ['audio/mp4', 'audio/x-m4a', 'audio/mpeg', 'audio/wav', 'audio/x-wav']

/** How long the app waits for a file to load before it gives up on reading its length. */
const PROBE_TIMEOUT_MS = 3000

const PROBE_STEP_MS = 50

export type ImportedAudio =
  | {
      kind: 'picked'
      uri: string
      durationMs: number
    }
  | {
      kind: 'cancelled'
    }
  | {
      kind: 'tooLong'
      durationMs: number
    }
  | {
      kind: 'unreadable'
    }

/** Lets the parent pick a ready recording and reads how long it is, so a file that is too long never reaches a card. */
export async function pickAudio(): Promise<ImportedAudio> {
  const picked = await getDocumentAsync({
    type: AUDIO_TYPES,
    copyToCacheDirectory: true,
  })
  const asset = picked.assets?.[0]

  if (picked.canceled || !asset) {
    return {
      kind: 'cancelled',
    }
  }

  const durationMs = await audioDurationMs(asset.uri)

  if (durationMs <= 0) {
    return {
      kind: 'unreadable',
    }
  }

  if (durationMs > MAX_AUDIO_MS) {
    return {
      kind: 'tooLong',
      durationMs,
    }
  }

  return {
    kind: 'picked',
    uri: asset.uri,
    durationMs,
  }
}

/** The length of an audio file in milliseconds; 0 when it cannot be read. */
export async function audioDurationMs(uri: string): Promise<number> {
  const player = createAudioPlayer({
    uri,
  })

  try {
    for (let waited = 0; waited < PROBE_TIMEOUT_MS; waited += PROBE_STEP_MS) {
      if (player.isLoaded && player.duration > 0) {
        return Math.round(player.duration * 1000)
      }

      await new Promise((resolve) => setTimeout(resolve, PROBE_STEP_MS))
    }

    return 0
  } finally {
    player.release()
  }
}
