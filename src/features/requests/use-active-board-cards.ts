import { useCallback } from 'react'
import { type Card, useRepositories } from '@/db'
import { useFocusQuery } from '@/db/use-focus-query'

/** Cards of the active board in their fixed order, reloaded whenever the screen comes back, for example from parent mode. */
export function useActiveBoardCards(): Card[] {
  const repositories = useRepositories()
  const cards = useFocusQuery(
    useCallback(async () => {
      const board = await repositories.boards.getActive()

      return board ? repositories.cards.listByBoard(board.id) : []
    }, [repositories]),
  )

  return cards ?? []
}
