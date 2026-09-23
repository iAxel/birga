import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { type Sequence, useRepositories } from '@/db'

/** The sequence the pause game plays; null when the parent has not made one, undefined while loading. */
export function useActiveSequence(): Sequence | null | undefined {
  const repositories = useRepositories()
  const [sequence, setSequence] = useState<Sequence | null | undefined>(undefined)

  useFocusEffect(
    useCallback(() => {
      repositories.sequences.getActive().then(setSequence)
    }, [repositories]),
  )

  return sequence
}
