import type { Database } from '@/db/database'
import type { SequenceItemRow, SequenceRow } from '@/db/schema'

/** A sequence the child knows by heart (SPEC §3). The pause game plays the active one. */
export interface Sequence {
  id: number
  title: string
  isActive: boolean
}

/** One step of a sequence: what the app says, and what the child sees while it waits. */
export interface SequenceItem {
  id: number
  sequenceId: number
  position: number
  text: string
  /** One character above the word, e.g. a digit; optional. */
  symbol: string | null
  /** The parent's voice for this item; an item without it cannot be played, so the game skips such a sequence. */
  audioPath: string | null
  imagePath: string | null
}

/** What the item editor saves. */
export interface SequenceItemInput {
  sequenceId: number
  text: string
  symbol: string | null
  audioPath: string | null
  imagePath: string | null
}

/** Sequences and their items. Items are deleted rather than archived: the game plays them by position, not by id. */
export class SequencesRepository {
  readonly #_db: Database

  constructor(db: Database) {
    this.#_db = db
  }

  async list(): Promise<Sequence[]> {
    const rows = await this.#_db.getAllAsync<SequenceRow>('SELECT * FROM sequences ORDER BY created_at, id')

    return rows.map((row) => this.#_toSequence(row))
  }

  async get(id: number): Promise<Sequence | null> {
    const row = await this.#_db.getFirstAsync<SequenceRow>('SELECT * FROM sequences WHERE id = ?', id)

    if (!row) {
      return null
    }

    return this.#_toSequence(row)
  }

  /** The sequence the pause game plays, if the parent has made one. */
  async getActive(): Promise<Sequence | null> {
    const row = await this.#_db.getFirstAsync<SequenceRow>('SELECT * FROM sequences WHERE is_active = 1')

    if (!row) {
      return null
    }

    return this.#_toSequence(row)
  }

  /** While no sequence is active, the new one becomes active. */
  async create(title: string): Promise<number> {
    const result = await this.#_db.runAsync(
      `INSERT INTO sequences (title, is_active, created_at)
       VALUES (?, NOT EXISTS (SELECT 1 FROM sequences WHERE is_active = 1), ?)`,
      title,
      Date.now(),
    )

    return result.lastInsertRowId
  }

  async rename(id: number, title: string): Promise<void> {
    await this.#_db.runAsync('UPDATE sequences SET title = ? WHERE id = ?', title, id)
  }

  /** Makes the sequence the one the game plays; at most one is active. */
  async activate(id: number): Promise<void> {
    await this.#_db.withTransactionAsync(async () => {
      await this.#_db.runAsync('UPDATE sequences SET is_active = 0 WHERE is_active = 1 AND id <> ?', id)

      await this.#_db.runAsync('UPDATE sequences SET is_active = 1 WHERE id = ?', id)
    })
  }

  /** The items in the order the app says them. */
  async listItems(sequenceId: number): Promise<SequenceItem[]> {
    const rows = await this.#_db.getAllAsync<SequenceItemRow>(
      'SELECT * FROM sequence_items WHERE sequence_id = ? ORDER BY position, id',
      sequenceId,
    )

    return rows.map((row) => this.#_toItem(row))
  }

  async getItem(id: number): Promise<SequenceItem | null> {
    const row = await this.#_db.getFirstAsync<SequenceItemRow>('SELECT * FROM sequence_items WHERE id = ?', id)

    if (!row) {
      return null
    }

    return this.#_toItem(row)
  }

  /** Adds the item at the end of its sequence. */
  async createItem(input: SequenceItemInput): Promise<number> {
    const result = await this.#_db.runAsync(
      `INSERT INTO sequence_items (sequence_id, position, text, symbol, audio_path, image_path)
       VALUES (?, (SELECT COALESCE(MAX(position) + 1, 0) FROM sequence_items WHERE sequence_id = ?), ?, ?, ?, ?)`,
      input.sequenceId,
      input.sequenceId,
      input.text,
      input.symbol,
      input.audioPath,
      input.imagePath,
    )

    return result.lastInsertRowId
  }

  /** Saves the editor's changes. An item moved to another sequence goes to the end of it. */
  async updateItem(id: number, input: SequenceItemInput): Promise<void> {
    await this.#_db.runAsync(
      `UPDATE sequence_items
       SET text = ?,
         symbol = ?,
         audio_path = ?,
         image_path = ?,
         position = CASE
           WHEN sequence_id = ? THEN position
           ELSE (SELECT COALESCE(MAX(position) + 1, 0) FROM sequence_items WHERE sequence_id = ?)
         END,
         sequence_id = ?
       WHERE id = ?`,
      input.text,
      input.symbol,
      input.audioPath,
      input.imagePath,
      input.sequenceId,
      input.sequenceId,
      input.sequenceId,
      id,
    )
  }

  /**
   * Removes the item and leaves the gap it made. The event log points at an item by its position, so renumbering the
   * ones behind it would quietly make every past pause of this sequence read as a different word.
   */
  async deleteItem(id: number): Promise<void> {
    await this.#_db.runAsync('DELETE FROM sequence_items WHERE id = ?', id)
  }

  /** Swaps the item with its neighbour one place earlier (-1) or later (+1). */
  async moveItem(id: number, offset: -1 | 1): Promise<void> {
    await this.#_db.withTransactionAsync(async () => {
      const item = await this.#_db.getFirstAsync<SequenceItemRow>('SELECT * FROM sequence_items WHERE id = ?', id)

      if (!item) {
        return
      }

      const neighbour = await this.#_db.getFirstAsync<SequenceItemRow>(
        offset === -1
          ? 'SELECT * FROM sequence_items WHERE sequence_id = ? AND position < ? ORDER BY position DESC LIMIT 1'
          : 'SELECT * FROM sequence_items WHERE sequence_id = ? AND position > ? ORDER BY position LIMIT 1',
        item.sequence_id,
        item.position,
      )

      if (!neighbour) {
        return
      }

      await this.#_db.runAsync('UPDATE sequence_items SET position = ? WHERE id = ?', neighbour.position, item.id)

      await this.#_db.runAsync('UPDATE sequence_items SET position = ? WHERE id = ?', item.position, neighbour.id)
    })
  }

  #_toSequence(row: SequenceRow): Sequence {
    return {
      id: row.id,
      title: row.title,
      isActive: row.is_active === 1,
    }
  }

  #_toItem(row: SequenceItemRow): SequenceItem {
    return {
      id: row.id,
      sequenceId: row.sequence_id,
      position: row.position,
      text: row.text,
      symbol: row.symbol,
      audioPath: row.audio_path,
      imagePath: row.image_path,
    }
  }
}
