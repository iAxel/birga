import { useCallback } from 'react'
import { type EventInput, useRepositories } from '@/db'

/**
 * Writes a child-facing interaction to the event log without making the UI wait for it. Sessions arrive in build step 4;
 * until then events carry no session.
 */
export function useEventLog(): (event: EventInput) => void {
  const { events } = useRepositories()

  return useCallback(
    (event: EventInput) => {
      events.log(null, event, Date.now())
    },
    [events],
  )
}
