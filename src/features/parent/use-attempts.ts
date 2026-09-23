import { useCallback } from 'react'
import { type Attempt, useRepositories } from '@/db'
import { useFocusQuery } from '@/db/use-focus-query'

/** How many of the newest attempts the log shows; older ones only leave the device with the export. */
const LIMIT = 100

/** The recorded attempts, newest first; undefined while loading. */
export function useAttempts(): Attempt[] | undefined {
  const repositories = useRepositories()

  return useFocusQuery(useCallback(() => repositories.events.listAttempts(LIMIT), [repositories]))
}
