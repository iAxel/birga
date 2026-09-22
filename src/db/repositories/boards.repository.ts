import type { Database } from '@/db/database'
import type { BoardRow } from '@/db/schema'

/** A set of request cards (SPEC §2). The child sees exactly one board: the active one. */
export interface Board {
  id: number
  title: string
  isActive: boolean
}

export class BoardsRepository {
  readonly #_db: Database

  constructor(db: Database) {
    this.#_db = db
  }

  async list(): Promise<Board[]> {
    const rows = await this.#_db.getAllAsync<BoardRow>('SELECT * FROM boards ORDER BY position, id')

    return rows.map((row) => this.#_toBoard(row))
  }

  async get(id: number): Promise<Board | null> {
    const row = await this.#_db.getFirstAsync<BoardRow>('SELECT * FROM boards WHERE id = ?', id)

    if (!row) {
      return null
    }

    return this.#_toBoard(row)
  }

  /** The board the child sees, if the parent has created one. */
  async getActive(): Promise<Board | null> {
    const row = await this.#_db.getFirstAsync<BoardRow>('SELECT * FROM boards WHERE is_active = 1')

    if (!row) {
      return null
    }

    return this.#_toBoard(row)
  }

  /** Adds a board at the end of the list. While no board is active, the new one becomes active. */
  async create(title: string): Promise<number> {
    const result = await this.#_db.runAsync(
      `INSERT INTO boards (title, position, is_active, created_at)
       VALUES (
         ?,
         (SELECT COALESCE(MAX(position) + 1, 0) FROM boards),
         NOT EXISTS (SELECT 1 FROM boards WHERE is_active = 1),
         ?
       )`,
      title,
      Date.now(),
    )

    return result.lastInsertRowId
  }

  async rename(id: number, title: string): Promise<void> {
    await this.#_db.runAsync('UPDATE boards SET title = ? WHERE id = ?', title, id)
  }

  /** Makes the board the one the child sees. The old one is switched off first: at most one board may be active. */
  async activate(id: number): Promise<void> {
    await this.#_db.withTransactionAsync(async () => {
      await this.#_db.runAsync('UPDATE boards SET is_active = 0 WHERE is_active = 1 AND id <> ?', id)

      await this.#_db.runAsync('UPDATE boards SET is_active = 1 WHERE id = ?', id)
    })
  }

  #_toBoard(row: BoardRow): Board {
    return {
      id: row.id,
      title: row.title,
      isActive: row.is_active === 1,
    }
  }
}
