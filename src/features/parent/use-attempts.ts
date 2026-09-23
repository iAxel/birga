import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { type Attempt, useRepositories } from '@/db'

/** How many of the newest attempts the log shows; older ones only leave the device with the export. */
const LIMIT = 100

/** The recorded attempts, newest first; undefined while loading. */
export function useAttempts(): Attempt[] | undefined {
  const repositories = useRepositories()
  const [attempts, setAttempts] = useState<Attempt[] | undefined>(undefined)

  useFocusEffect(
    useCallback(() => {
      repositories.events.listAttempts(LIMIT).then(setAttempts)
    }, [repositories]),
  )

  return attempts
}
