import { useSQLiteContext } from 'expo-sqlite'
import { useMemo } from 'react'
import { BoardsRepository } from '@/db/repositories/boards.repository'
import { CardsRepository } from '@/db/repositories/cards.repository'
import { EventsRepository } from '@/db/repositories/events.repository'
import { SequencesRepository } from '@/db/repositories/sequences.repository'
import { SessionsRepository } from '@/db/repositories/sessions.repository'
import { SettingsRepository } from '@/db/repositories/settings.repository'

export interface Repositories {
  boards: BoardsRepository
  cards: CardsRepository
  events: EventsRepository
  sequences: SequencesRepository
  sessions: SessionsRepository
  settings: SettingsRepository
}

/** Repositories over the app database; the same instances as long as the connection lives. */
export function useRepositories(): Repositories {
  const db = useSQLiteContext()

  return useMemo(() => {
    const events = new EventsRepository(db)

    return {
      boards: new BoardsRepository(db),
      cards: new CardsRepository(db),
      events,
      sequences: new SequencesRepository(db),
      sessions: new SessionsRepository(db, events),
      settings: new SettingsRepository(db),
    }
  }, [db])
}
