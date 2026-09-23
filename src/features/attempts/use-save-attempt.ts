import { useCallback } from 'react'
import { type EventInput, storeMedia } from '@/db'
import { useEventLog } from '@/features/session/use-event-log'

/** What the attempt was made for: a card of the board, or an item of the sequence the pause game is playing. */
export type AttemptTarget = Pick<EventInput, 'cardId' | 'sequenceId' | 'itemPosition'>

/**
 * Keeps a recording the parent made of the child's attempt and logs where it went (SPEC §2, §3). This is the only
 * audio of the child the app stores: the parent starts it by hand, it is never played back to the child, and it leaves
 * the device only with an export.
 */
export function useSaveAttempt(): (uri: string, durationMs: number, target: AttemptTarget) => Promise<void> {
  const logEvent = useEventLog()

  return useCallback(
    async (uri, durationMs, target) => {
      const audioPath = await storeMedia(uri, 'attempts')

      logEvent({
        ...target,
        type: 'attempt_recorded',
        payload: {
          audioPath,
          durationMs,
        },
      })
    },
    [logEvent],
  )
}
