import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { type Board, useRepositories } from '@/db'

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
  const [activeBoard, setActiveBoard] = useState<ActiveBoard | null | undefined>(undefined)

  useFocusEffect(
    useCallback(() => {
      async function load(): Promise<void> {
        const board = await repositories.boards.getActive()

        if (!board) {
          setActiveBoard(null)

          return
        }

        const cards = await repositories.cards.listByBoard(board.id)

        setActiveBoard({
          board,
          cardCount: cards.length,
        })
      }

      load()
    }, [repositories]),
  )

  return activeBoard
}
