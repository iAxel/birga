import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { type Card, useRepositories } from '@/db'

/** Cards of the active board in their fixed order, reloaded whenever the screen comes back, for example from parent mode. */
export function useActiveBoardCards(): Card[] {
  const repositories = useRepositories()
  const [cards, setCards] = useState<Card[]>([])

  useFocusEffect(
    useCallback(() => {
      async function load(): Promise<void> {
        const board = await repositories.boards.getActive()

        setCards(board ? await repositories.cards.listByBoard(board.id) : [])
      }

      load()
    }, [repositories]),
  )

  return cards
}
