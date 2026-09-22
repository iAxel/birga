import { describe, expect, test } from '@jest/globals'
import { migrate } from '@/db/migrate'
import { migrations } from '@/db/migrations'
import { initial } from '@/db/migrations/0001-initial'
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
      db.execAsync("INSERT INTO cards (board_id, text, audio_path, position, created_at) VALUES (99, 'suv', 'suv.m4a', 0, 0)"),
    ).rejects.toThrow('FOREIGN KEY constraint failed')
  })

  test('requires the voice recording of a card but not its photo', async () => {
    const db = await migratedDatabase()

    await db.execAsync("INSERT INTO boards (id, title, position, is_active, created_at) VALUES (1, 'Ovqat', 0, 1, 0)")

    await expect(
      db.execAsync("INSERT INTO cards (board_id, text, position, created_at) VALUES (1, 'suv', 0, 0)"),
    ).rejects.toThrow('NOT NULL constraint failed: cards.audio_path')

    await expect(
      db.execAsync("INSERT INTO cards (board_id, text, audio_path, position, created_at) VALUES (1, 'yana', 'yana.m4a', 0, 0)"),
    ).resolves.toBeUndefined()
  })

  test('keeps cards, their ids and the id counter when audio becomes required', async () => {
    const db = new NodeDatabase()

    await migrate(db, [initial])

    await db.execAsync(`
      INSERT INTO boards (id, title, position, is_active, created_at) VALUES (1, 'Ovqat', 0, 1, 0);
      INSERT INTO cards (board_id, text, audio_path, position, created_at) VALUES (1, 'suv', 'suv.m4a', 0, 0);
      INSERT INTO cards (board_id, text, audio_path, position, created_at) VALUES (1, 'non', 'non.m4a', 1, 0);
      DELETE FROM cards WHERE id = 2;
      INSERT INTO sessions (id, started_at) VALUES (1, 0);
      INSERT INTO events (session_id, ts, type, card_id) VALUES (1, 0, 'request_tap', 1);
    `)

    await migrate(db, migrations)

    await db.execAsync(
      "INSERT INTO cards (board_id, text, audio_path, position, created_at) VALUES (1, 'yana', 'yana.m4a', 1, 0)",
    )

    expect(await db.getAllAsync('SELECT id, text, audio_path FROM cards ORDER BY id')).toEqual([
      {
        id: 1,
        text: 'suv',
        audio_path: 'suv.m4a',
      },
      {
        id: 3,
        text: 'yana',
        audio_path: 'yana.m4a',
      },
    ])
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
