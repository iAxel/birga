import type { Database } from '@/db/database'

/**
 * Data tables, children before parents, so deleting them in this order never trips a foreign key. Rows go, tables stay:
 * the schema and its user_version are untouched, so nothing is migrated again after a reset.
 */
const DATA_TABLES = ['events', 'sessions', 'sequence_items', 'sequences', 'cards', 'boards', 'settings'] as const

/**
 * Throwing data away on the parent's word (SPEC §5). Rows only: the files the rows point at are deleted by the caller,
 * which is the layer that knows about the document directory.
 */
export class MaintenanceRepository {
  readonly #_db: Database

  constructor(db: Database) {
    this.#_db = db
  }

  /** The diary: every session and every event. Cards, sequences and settings stay as they are. */
  async clearLog(): Promise<void> {
    await this.#_db.withTransactionAsync(async () => {
      await this.#_db.runAsync('DELETE FROM events')

      await this.#_db.runAsync('DELETE FROM sessions')
    })
  }

  /** Everything the parent ever entered, back to a fresh install, with the schema left applied. */
  async clearAll(): Promise<void> {
    await this.#_db.withTransactionAsync(async () => {
      for (const table of DATA_TABLES) {
        await this.#_db.runAsync(`DELETE FROM ${table}`)
      }
    })
  }
}
