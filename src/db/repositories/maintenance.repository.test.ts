import { describe, expect, test } from '@jest/globals'
import { BoardsRepository } from '@/db/repositories/boards.repository'
import { CardsRepository } from '@/db/repositories/cards.repository'
import { EventsRepository } from '@/db/repositories/events.repository'
import { MaintenanceRepository } from '@/db/repositories/maintenance.repository'
import { SessionsRepository } from '@/db/repositories/sessions.repository'
import { SettingsRepository } from '@/db/repositories/settings.repository'
import { migratedDatabase } from '@/db/testing/migrated-database'
import type { NodeDatabase } from '@/db/testing/node-database'

interface Fixture {
  db: NodeDatabase
  cards: CardsRepository
  maintenance: MaintenanceRepository
  settings: SettingsRepository
}

/** A board with a card, a session with its events, and a setting the parent changed. */
async function setUp(): Promise<Fixture> {
  const db = await migratedDatabase()
  const boards = new BoardsRepository(db)
  const cards = new CardsRepository(db)
  const events = new EventsRepository(db)
  const sessions = new SessionsRepository(db, events)
  const settings = new SettingsRepository(db)
  const boardId = await boards.create('Uy')

  const cardId = await cards.create({
    boardId,
    text: 'suv',
    audioPath: 'media/cards/suv.m4a',
    audioLevels: null,
    imagePath: null,
  })

  const sessionId = await sessions.start(1000)

  await events.log(
    sessionId,
    {
      type: 'request_tap',
      cardId,
    },
    1100,
  )

  await settings.save('childName', 'Ali')

  return {
    db,
    cards,
    maintenance: new MaintenanceRepository(db),
    settings,
  }
}

async function countOf(db: NodeDatabase, table: string): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`)

  return row?.count ?? 0
}

describe('MaintenanceRepository', () => {
  test('clears the diary and leaves the cards and the settings alone', async () => {
    const { db, cards, maintenance, settings } = await setUp()

    await maintenance.clearLog()

    expect(await countOf(db, 'events')).toBe(0)
    expect(await countOf(db, 'sessions')).toBe(0)
    expect(await cards.listAll()).toHaveLength(1)
    expect((await settings.load()).childName).toBe('Ali')
  })

  test('clears everything the parent entered, and keeps the schema applied', async () => {
    const { db, maintenance, settings } = await setUp()

    await maintenance.clearAll()

    for (const table of ['events', 'sessions', 'cards', 'boards', 'sequences', 'sequence_items', 'settings']) {
      expect([table, await countOf(db, table)]).toEqual([table, 0])
    }

    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')

    expect(version?.user_version).toBeGreaterThan(0)
    expect((await settings.load()).childName).toBe('')
  })
})
