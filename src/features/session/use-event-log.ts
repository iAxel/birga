import { useCallback } from 'react'
import { type EventInput, useRepositories } from '@/db'
import { useSession } from '@/features/session/session-provider'

/**
 * Writes a child-facing interaction to the event log, with the running session, without making the UI wait for it. A
 * write that fails is dropped rather than thrown into nowhere: the child is mid-play, and there is nothing to tell him.
 */
export function useEventLog(): (event: EventInput) => void {
  const { events } = useRepositories()
  const { active } = useSession()
  const sessionId = active?.id ?? null

  return useCallback(
    (event: EventInput) => {
      events.log(sessionId, event, Date.now()).catch(() => undefined)
    },
    [events, sessionId],
  )
}
