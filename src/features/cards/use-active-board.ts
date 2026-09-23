import { useCallback } from 'react'
import { type Board, useRepositories } from '@/db'
import { useFocusQuery } from '@/db/use-focus-query'

export interface ActiveBoard {
  board: Board
  cardCount: number
}

/**
 * The board the child sees and how many cards it holds, reloaded whenever the screen comes back into view. Null when
 * there is no active board; undefined while loading.
 */
export function useActiveBoard(): ActiveBoard | null | undefined {
  const repositories = useRepositories()

  return useFocusQuery(
    useCallback(async () => {
      const board = await repositories.boards.getActive()

      if (!board) {
        return null
      }

      const cards = await repositories.cards.listByBoard(board.id)

      return {
        board,
        cardCount: cards.length,
      }
    }, [repositories]),
  )
}
