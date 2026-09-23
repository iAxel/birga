import { useSQLiteContext } from 'expo-sqlite'
import { useMemo } from 'react'
import { BoardsRepository } from '@/db/repositories/boards.repository'
import { CardsRepository } from '@/db/repositories/cards.repository'
import { EventsRepository } from '@/db/repositories/events.repository'
import { MaintenanceRepository } from '@/db/repositories/maintenance.repository'
import { SequencesRepository } from '@/db/repositories/sequences.repository'
import { SessionsRepository } from '@/db/repositories/sessions.repository'
import { SettingsRepository } from '@/db/repositories/settings.repository'
import { serializedConnection } from '@/db/serialized-database'

export interface Repositories {
  boards: BoardsRepository
  cards: CardsRepository
  events: EventsRepository
  maintenance: MaintenanceRepository
  sequences: SequencesRepository
  sessions: SessionsRepository
  settings: SettingsRepository
}

/**
 * Repositories over the app database, the same instances as long as the connection lives. Every screen gets its own
 * repositories, but they all write through the connection's one queue of transactions.
 */
export function useRepositories(): Repositories {
  const db = useSQLiteContext()

  return useMemo(() => {
    const database = serializedConnection(db)
    const events = new EventsRepository(database)

    return {
      boards: new BoardsRepository(database),
      cards: new CardsRepository(database),
      events,
      maintenance: new MaintenanceRepository(database),
      sequences: new SequencesRepository(database),
      sessions: new SessionsRepository(database, events),
      settings: new SettingsRepository(database),
    }
  }, [db])
}
