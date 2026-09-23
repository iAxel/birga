import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { type SequenceItem, useRepositories } from '@/db'

/** Items of the active sequence that the app can actually say; an item without a recording is skipped. */
export function usePauseSequence(): SequenceItem[] | undefined {
  const repositories = useRepositories()
  const [items, setItems] = useState<SequenceItem[] | undefined>(undefined)

  useFocusEffect(
    useCallback(() => {
      async function load(): Promise<void> {
        const sequence = await repositories.sequences.getActive()

        if (!sequence) {
          setItems([])

          return
        }

        const all = await repositories.sequences.listItems(sequence.id)

        setItems(all.filter((item) => item.audioPath !== null))
      }

      load()
    }, [repositories]),
  )

  return items
}
