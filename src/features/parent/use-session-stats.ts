import { useCallback } from 'react'
import { useRepositories } from '@/db'
import { useFocusQuery } from '@/db/use-focus-query'
import { startOfDay } from '@/features/parent/relative-time'

export interface SessionStats {
  /** When the last session ended, whatever ended it; null before the first one. */
  lastEndedAt: number | null
  /** Sessions started since midnight. */
  todayCount: number
}

/**
 * What parent home says about the sessions themselves, for the day starting at `day`: reloaded whenever the screen
 * comes back into view, and when midnight passes while it is open.
 */
export function useSessionStats(day: number): SessionStats | undefined {
  const repositories = useRepositories()

  return useFocusQuery(
    useCallback(async () => {
      const lastEndedAt = await repositories.sessions.lastEndedAt()
      const todayCount = await repositories.sessions.countStartedSince(startOfDay(day))

      return {
        lastEndedAt,
        todayCount,
      }
    }, [repositories, day]),
  )
}
