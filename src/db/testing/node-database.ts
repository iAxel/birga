import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import type { SQLiteBindValue, SQLiteRunResult } from 'expo-sqlite'
import type { Database } from '@/db/database'

/** In-memory SQLite from Node behind the async surface of expo-sqlite, so Jest can run real migrations and queries. */
export class NodeDatabase implements Database {
  readonly #_db: DatabaseSync

  constructor() {
    this.#_db = new DatabaseSync(':memory:')
  }

  async execAsync(source: string): Promise<void> {
    this.#_db.exec(source)
  }

  async runAsync(source: string, ...params: SQLiteBindValue[]): Promise<SQLiteRunResult> {
    const result = this.#_db.prepare(source).run(...this.#_bind(params))

    return {
      lastInsertRowId: Number(result.lastInsertRowid),
      changes: Number(result.changes),
    }
  }

  async getFirstAsync<T>(source: string, ...params: SQLiteBindValue[]): Promise<T | null> {
    const row = this.#_db.prepare(source).get(...this.#_bind(params))

    return (row as T | undefined) ?? null
  }

  async getAllAsync<T>(source: string, ...params: SQLiteBindValue[]): Promise<T[]> {
    return this.#_db.prepare(source).all(...this.#_bind(params)) as T[]
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

  /** expo-sqlite binds booleans as integers and accepts ArrayBuffer blobs; node:sqlite does neither. */
  #_bind(params: SQLiteBindValue[]): SQLInputValue[] {
    return params.map((value) => {
      if (typeof value === 'boolean') {
        return value ? 1 : 0
      }

      if (value instanceof ArrayBuffer) {
        return new Uint8Array(value)
      }

      return value
    })
  }
}
