import { useCallback } from 'react'
import { type SequenceItem, useRepositories } from '@/db'
import { useFocusQuery } from '@/db/use-focus-query'

/** Items of the active sequence that the app can actually say; an item without a recording is skipped. */
export function usePauseSequence(): SequenceItem[] | undefined {
  const repositories = useRepositories()

  return useFocusQuery(
    useCallback(async () => {
      const sequence = await repositories.sequences.getActive()

      if (!sequence) {
        return []
      }

      const items = await repositories.sequences.listItems(sequence.id)

      return items.filter((item) => item.audioPath !== null)
    }, [repositories]),
  )
}
