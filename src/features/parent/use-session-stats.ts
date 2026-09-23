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

/** What parent home says about the sessions themselves, reloaded whenever the screen comes back into view. */
export function useSessionStats(): SessionStats | undefined {
  const repositories = useRepositories()

  return useFocusQuery(
    useCallback(async () => {
      const lastEndedAt = await repositories.sessions.lastEndedAt()
      const todayCount = await repositories.sessions.countStartedSince(startOfDay(Date.now()))

      return {
        lastEndedAt,
        todayCount,
      }
    }, [repositories]),
  )
}
