import { DatabaseSync } from 'node:sqlite'
import type { MigrationDatabase } from '@/db/migrate'

/** In-memory SQLite from Node behind the async surface of expo-sqlite, so Jest can run real migrations. */
export class NodeDatabase implements MigrationDatabase {
  readonly #_db: DatabaseSync

  constructor() {
    this.#_db = new DatabaseSync(':memory:')
  }

  async execAsync(source: string): Promise<void> {
    this.#_db.exec(source)
  }

  async getFirstAsync<T>(source: string): Promise<T | null> {
    const row = this.#_db.prepare(source).get()

    return (row as T | undefined) ?? null
  }

  async getAllAsync<T>(source: string): Promise<T[]> {
    return this.#_db.prepare(source).all() as T[]
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    this.#_db.exec('BEGIN')

    try {
      await task()

      this.#_db.exec('COMMIT')
    } catch (err) {
      this.#_db.exec('ROLLBACK')

      throw err
    }
  }

  async userVersion(): Promise<number> {
    const row = await this.getFirstAsync<{ user_version: number }>('PRAGMA user_version')

    return row?.user_version ?? 0
  }

  async tableNames(): Promise<string[]> {
    const rows = await this.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )

    return rows.map((row) => row.name)
  }
}
