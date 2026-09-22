import { describe, expect, test } from '@jest/globals'
import { migrate, type Migration } from '@/db/migrate'
import { NodeDatabase } from '@/db/testing/node-database'

const createNotes: Migration = {
  version: 1,
  name: 'create-notes',
  sql: 'CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT NOT NULL);',
}

const addTitle: Migration = {
  version: 2,
  name: 'add-title',
  sql: "ALTER TABLE notes ADD COLUMN title TEXT NOT NULL DEFAULT '';",
}

describe('migrate', () => {
  test('applies pending migrations in order and records the version', async () => {
    const db = new NodeDatabase()

    await migrate(db, [createNotes, addTitle])

    expect(await db.userVersion()).toBe(2)

    await expect(db.execAsync("INSERT INTO notes (body, title) VALUES ('a', 'b')")).resolves.toBeUndefined()
  })

  test('skips migrations that are already applied', async () => {
    const db = new NodeDatabase()

    await migrate(db, [createNotes])

    await migrate(db, [createNotes, addTitle])

    expect(await db.userVersion()).toBe(2)
  })

  test('rolls back a failing migration and keeps the previous version', async () => {
    const db = new NodeDatabase()
    const broken: Migration = {
      version: 2,
      name: 'broken',
      sql: 'CREATE TABLE tags (id INTEGER PRIMARY KEY); INSERT INTO missing VALUES (1);',
    }

    await migrate(db, [createNotes])

    await expect(migrate(db, [createNotes, broken])).rejects.toThrow('MIGRATION_FAILED: 2-broken')

    expect(await db.userVersion()).toBe(1)
    expect(await db.tableNames()).toEqual(['notes'])
  })

  test('rolls back a migration that leaves foreign key violations', async () => {
    const db = new NodeDatabase()
    const orphan: Migration = {
      version: 1,
      name: 'orphan',
      sql: `
        CREATE TABLE parents (id INTEGER PRIMARY KEY);
        CREATE TABLE children (parent_id INTEGER REFERENCES parents (id));
        INSERT INTO children (parent_id) VALUES (42);
      `,
    }

    await expect(migrate(db, [orphan])).rejects.toHaveProperty('cause.message', 'FOREIGN_KEY_VIOLATION')

    expect(await db.userVersion()).toBe(0)
    expect(await db.tableNames()).toEqual([])
  })

  test('leaves foreign keys enforced', async () => {
    const db = new NodeDatabase()

    await migrate(db, [createNotes])

    expect(await db.getFirstAsync('PRAGMA foreign_keys')).toEqual({
      foreign_keys: 1,
    })
  })

  test('refuses a database created by a newer app version', async () => {
    const db = new NodeDatabase()

    await db.execAsync('PRAGMA user_version = 5')

    await expect(migrate(db, [createNotes])).rejects.toThrow('DATABASE_NEWER_THAN_APP')
  })

  test('refuses migrations that are not numbered 1..n', async () => {
    const db = new NodeDatabase()

    await expect(migrate(db, [addTitle])).rejects.toThrow('MIGRATIONS_NOT_SEQUENTIAL')
  })
})
