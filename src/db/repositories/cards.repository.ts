import type { Database } from '@/db/database'
import type { CardRow } from '@/db/schema'

/** A request card. Media paths are relative to the document directory; the photo is optional, the voice is not. */
export interface Card {
  id: number
  boardId: number
  text: string
  /** An archived card is out of the child's board but stays for the events that point at it. */
  isArchived: boolean
  imagePath: string | null
  audioPath: string
  /** Loudness of the recording, one value per tenth of a second; null for cards recorded before it was kept. */
  audioLevels: number[] | null
}

/** What the card editor saves. The text is stored exactly as the parent typed it. */
export interface CardInput {
  boardId: number
  text: string
  imagePath: string | null
  audioPath: string
  audioLevels: number[] | null
}

/** Cards are archived, never deleted, so the event log keeps its references (SPEC §6). */
export class CardsRepository {
  readonly #_db: Database

  constructor(db: Database) {
    this.#_db = db
  }

  /** Cards of a board in their fixed order, the order the child sees; archived cards are left out. */
  async listByBoard(boardId: number): Promise<Card[]> {
    const rows = await this.#_db.getAllAsync<CardRow>(
      'SELECT * FROM cards WHERE board_id = ? AND is_archived = 0 ORDER BY position, id',
      boardId,
    )

    return rows.map((row) => this.#_toCard(row))
  }

  /** Every card of every board, archived ones too: the export keeps the words the event log refers to. */
  async listAll(): Promise<Card[]> {
    const rows = await this.#_db.getAllAsync<CardRow>('SELECT * FROM cards ORDER BY board_id, position, id')

    return rows.map((row) => this.#_toCard(row))
  }

  async get(id: number): Promise<Card | null> {
    const row = await this.#_db.getFirstAsync<CardRow>('SELECT * FROM cards WHERE id = ?', id)

    if (!row) {
      return null
    }

    return this.#_toCard(row)
  }

  /** Adds the card at the end of its board. */
  async create(input: CardInput): Promise<number> {
    const result = await this.#_db.runAsync(
      `INSERT INTO cards (board_id, text, image_path, audio_path, audio_levels, position, created_at)
       VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(position) + 1, 0) FROM cards WHERE board_id = ?), ?)`,
      input.boardId,
      input.text,
      input.imagePath,
      input.audioPath,
      encodeLevels(input.audioLevels),
      input.boardId,
      Date.now(),
    )

    return result.lastInsertRowId
  }

  /** Saves the editor's changes. A card moved to another board goes to the end of that board. */
  async update(id: number, input: CardInput): Promise<void> {
    await this.#_db.runAsync(
      `UPDATE cards
       SET text = ?,
         image_path = ?,
         audio_path = ?,
         audio_levels = ?,
         position = CASE
           WHEN board_id = ? THEN position
           ELSE (SELECT COALESCE(MAX(position) + 1, 0) FROM cards WHERE board_id = ?)
         END,
         board_id = ?
       WHERE id = ?`,
      input.text,
      input.imagePath,
      input.audioPath,
      encodeLevels(input.audioLevels),
      input.boardId,
      input.boardId,
      input.boardId,
      id,
    )
  }

  async archive(id: number): Promise<void> {
    await this.#_db.runAsync('UPDATE cards SET is_archived = 1 WHERE id = ?', id)
  }

  /** Swaps the card with its neighbour one place earlier (-1) or later (+1); positions are rewritten as 0..n-1. */
  async move(id: number, offset: -1 | 1): Promise<void> {
    await this.#_db.withTransactionAsync(async () => {
      const card = await this.get(id)

      if (!card) {
        return
      }

      const ids = (await this.listByBoard(card.boardId)).map((boardCard) => boardCard.id)
      const from = ids.indexOf(id)
      const to = from + offset

      if (from < 0 || to < 0 || to >= ids.length) {
        return
      }

      ids[from] = ids[to]
      ids[to] = id

      await this.#_writePositions(ids)
    })
  }

  async #_writePositions(ids: number[]): Promise<void> {
    for (const [position, id] of ids.entries()) {
      await this.#_db.runAsync('UPDATE cards SET position = ? WHERE id = ?', position, id)
    }
  }

  #_toCard(row: CardRow): Card {
    return {
      id: row.id,
      boardId: row.board_id,
      text: row.text,
      imagePath: row.image_path,
      audioPath: row.audio_path,
      audioLevels: decodeLevels(row.audio_levels),
      isArchived: row.is_archived === 1,
    }
  }
}

function encodeLevels(levels: number[] | null): string | null {
  if (!levels || levels.length === 0) {
    return null
  }

  return JSON.stringify(levels.map((level) => Math.round(level * 100) / 100))
}

/** A malformed value is treated as no recording shape at all: the editor then draws the bars flat. */
function decodeLevels(raw: string | null): number[] | null {
  if (raw === null) {
    return null
  }

  try {
    const levels: unknown = JSON.parse(raw)

    if (Array.isArray(levels) && levels.every((level) => typeof level === 'number')) {
      return levels
    }
  } catch {
    return null
  }

  return null
}
