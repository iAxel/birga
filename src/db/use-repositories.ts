import { useSQLiteContext } from 'expo-sqlite'
import { useMemo } from 'react'
import { BoardsRepository } from '@/db/repositories/boards.repository'
import { CardsRepository } from '@/db/repositories/cards.repository'
import { EventsRepository } from '@/db/repositories/events.repository'
import { SettingsRepository } from '@/db/repositories/settings.repository'

export interface Repositories {
  boards: BoardsRepository
  cards: CardsRepository
  events: EventsRepository
  settings: SettingsRepository
}

/** Repositories over the app database; the same instances as long as the connection lives. */
export function useRepositories(): Repositories {
  const db = useSQLiteContext()

  return useMemo(
    () => ({
      boards: new BoardsRepository(db),
      cards: new CardsRepository(db),
      events: new EventsRepository(db),
      settings: new SettingsRepository(db),
    }),
    [db],
  )
}
