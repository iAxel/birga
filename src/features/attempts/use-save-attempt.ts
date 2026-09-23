import { useCallback } from 'react'
import { deleteTake } from '@/audio/takes'
import { type EventInput, storeMedia } from '@/db'
import { useEventLog } from '@/features/session/use-event-log'

/** What the attempt was made for: a card of the board, or an item of the sequence the pause game is playing. */
export interface AttemptTarget extends Pick<EventInput, 'cardId' | 'sequenceId' | 'itemPosition'> {
  /** The word of that card or item as it reads now, kept with the event so a later edit does not change it. */
  word?: string
  /** The sequence item, by its id: its position may change when the parent reorders the sequence. */
  itemId?: number
}

/**
 * Keeps a recording the parent made of the child's attempt and logs where it went (SPEC §2, §3). This is the only
 * audio of the child the app stores: the parent starts it by hand, it is never played back to the child, and it leaves
 * the device only with an export. The recorder's own take is deleted as soon as it is copied, or when it cannot be,
 * so no second copy of the child's voice waits in the cache.
 */
export function useSaveAttempt(): (uri: string, durationMs: number, target: AttemptTarget) => Promise<void> {
  const logEvent = useEventLog()

  return useCallback(
    async (uri, durationMs, target) => {
      try {
        const audioPath = await storeMedia(uri, 'attempts')

        logEvent({
          type: 'attempt_recorded',
          cardId: target.cardId,
          sequenceId: target.sequenceId,
          itemPosition: target.itemPosition,
          payload: attemptPayload(audioPath, durationMs, target),
        })
      } finally {
        deleteTake(uri)
      }
    },
    [logEvent],
  )
}

function attemptPayload(audioPath: string, durationMs: number, target: AttemptTarget): Record<string, string | number> {
  const payload: Record<string, string | number> = {
    audioPath,
    durationMs,
  }

  if (target.word !== undefined) {
    payload.word = target.word
  }

  if (target.itemId !== undefined) {
    payload.itemId = target.itemId
  }

  return payload
}
