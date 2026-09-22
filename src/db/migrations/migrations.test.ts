import { describe, expect, test } from '@jest/globals'
import { migrate } from '@/db/migrate'
import { migrations } from '@/db/migrations'
import { NodeDatabase } from '@/db/testing/node-database'

async function migratedDatabase(): Promise<NodeDatabase> {
  const db = new NodeDatabase()

  await migrate(db, migrations)

  return db
}

describe('schema', () => {
  test('has every table from the spec', async () => {
    const db = await migratedDatabase()

    expect(await db.tableNames()).toEqual(['boards', 'cards', 'events', 'sequence_items', 'sequences', 'sessions', 'settings'])
  })

  test('keeps at most one board active', async () => {
    const db = await migratedDatabase()

    await db.execAsync("INSERT INTO boards (title, position, is_active, created_at) VALUES ('Ovqat', 0, 1, 0)")

    await expect(
      db.execAsync("INSERT INTO boards (title, position, is_active, created_at) VALUES ('O''yin', 1, 1, 0)"),
    ).rejects.toThrow('UNIQUE constraint failed')

    await expect(
      db.execAsync("INSERT INTO boards (title, position, is_active, created_at) VALUES ('O''yin', 1, 0, 0)"),
    ).resolves.toBeUndefined()
  })

  test('rejects a card on a board that does not exist', async () => {
    const db = await migratedDatabase()

    await expect(
      db.execAsync("INSERT INTO cards (board_id, text, position, created_at) VALUES (99, 'suv', 0, 0)"),
    ).rejects.toThrow('FOREIGN KEY constraint failed')
  })

  test('keeps a sequence that the event log points to', async () => {
    const db = await migratedDatabase()

    await db.execAsync(`
      INSERT INTO sequences (id, title, is_active, created_at) VALUES (1, 'Sanash', 1, 0);
      INSERT INTO sessions (id, started_at) VALUES (1, 0);
      INSERT INTO events (session_id, ts, type, sequence_id, item_position) VALUES (1, 0, 'pause_open', 1, 3);
    `)

    await expect(db.execAsync('DELETE FROM sequences WHERE id = 1')).rejects.toThrow('FOREIGN KEY constraint failed')
  })
})
