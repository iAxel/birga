import { useCallback } from 'react'
import { type Sequence, useRepositories } from '@/db'
import { useFocusQuery } from '@/db/use-focus-query'

/** The sequence the pause game plays; null when the parent has not made one, undefined while loading. */
export function useActiveSequence(): Sequence | null | undefined {
  const repositories = useRepositories()

  return useFocusQuery(useCallback(() => repositories.sequences.getActive(), [repositories]))
}
