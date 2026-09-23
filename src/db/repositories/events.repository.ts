import type { Database } from '@/db/database'
import type { EventRow, EventType } from '@/db/schema'

interface AttemptRow {
  id: number
  ts: number
  word: string | null
  payload_json: string | null
}

interface CountRow {
  type: EventType
  count: number
}

interface CardCountRow {
  card_id: number | null
  card_text: string | null
  count: number
}

/** How often one card took part in something, most often first. */
export interface CardCount {
  cardId: number | null
  /** The word of the card; null when the card is gone. */
  cardText: string | null
  count: number
}

/** An attempt of the child the parent recorded, as the log screen lists it (SPEC §5). */
export interface Attempt {
  id: number
  /** When it was recorded. */
  ts: number
  /** The word it belongs to, from a card or from an item of a sequence; null when neither is there any more. */
  word: string | null
  audioPath: string
  durationMs: number
}

/**
 * The word an event was about, as the event itself wrote it down: a card can be renamed and the items of a sequence
 * reordered, so the row a past event points at may say something else today. Events written before the word was kept
 * have none, and fall back on that row.
 */
const PAYLOAD_WORD = "CASE WHEN json_valid(events.payload_json) THEN json_extract(events.payload_json, '$.word') END"

/** One entry of the event log (SPEC §6). Fields that an event type does not use stay empty. */
export interface EventInput {
  type: EventType
  cardId?: number | null
  sequenceId?: number | null
  itemPosition?: number | null
  payload?: Record<string, string | number | boolean> | null
}

/** The event log is append-only: rows are never updated or deleted. */
export class EventsRepository {
  readonly #_db: Database

  constructor(db: Database) {
    this.#_db = db
  }

  /** How many events of each type happened in `[from, to)`; a type that did not happen is missing. */
  async countsByType(from: number, to: number): Promise<Partial<Record<EventType, number>>> {
    const rows = await this.#_db.getAllAsync<CountRow>(
      'SELECT type, COUNT(*) AS count FROM events WHERE ts >= ? AND ts < ? GROUP BY type',
      from,
      to,
    )

    return Object.fromEntries(rows.map((row) => [row.type, row.count]))
  }

  /**
   * How often each card took part in events of one type in `[from, to)`: taps per card, or taps the board ignored. A
   * card that was renamed in between is counted once for each word it had.
   */
  async countsByCard(type: EventType, from: number, to: number): Promise<CardCount[]> {
    const rows = await this.#_db.getAllAsync<CardCountRow>(
      `SELECT events.card_id, COALESCE(${PAYLOAD_WORD}, cards.text) AS card_text, COUNT(*) AS count
       FROM events
       LEFT JOIN cards ON cards.id = events.card_id
       WHERE events.type = ? AND events.ts >= ? AND events.ts < ? AND events.card_id IS NOT NULL
       GROUP BY events.card_id, card_text
       ORDER BY count DESC, card_text`,
      type,
      from,
      to,
    )

    return rows.map((row) => ({
      cardId: row.card_id,
      cardText: row.card_text,
      count: row.count,
    }))
  }

  /** When events of one type happened in `[from, to)`: the week strip counts them into days itself. */
  async timesOf(type: EventType, from: number, to: number): Promise<number[]> {
    const rows = await this.#_db.getAllAsync<{ ts: number }>(
      'SELECT ts FROM events WHERE type = ? AND ts >= ? AND ts < ? ORDER BY ts',
      type,
      from,
      to,
    )

    return rows.map((row) => row.ts)
  }

  /** Every event, oldest first: the export writes them as a spreadsheet. */
  async listAll(): Promise<EventRow[]> {
    return this.#_db.getAllAsync<EventRow>('SELECT * FROM events ORDER BY ts, id')
  }

  /** The recorded attempts, newest first. Rows whose payload is damaged are left out rather than shown empty. */
  async listAttempts(limit: number): Promise<Attempt[]> {
    const rows = await this.#_db.getAllAsync<AttemptRow>(
      `SELECT events.id, events.ts, events.payload_json, COALESCE(${PAYLOAD_WORD}, cards.text, sequence_items.text) AS word
       FROM events
       LEFT JOIN cards ON cards.id = events.card_id
       LEFT JOIN sequence_items
         ON sequence_items.sequence_id = events.sequence_id AND sequence_items.position = events.item_position
       WHERE events.type = 'attempt_recorded'
       ORDER BY events.ts DESC
       LIMIT ?`,
      limit,
    )

    return rows.flatMap((row) => {
      const attempt = toAttempt(row)

      return attempt ? [attempt] : []
    })
  }

  async log(sessionId: number | null, event: EventInput, ts: number): Promise<void> {
    await this.#_db.runAsync(
      `INSERT INTO events (session_id, ts, type, card_id, sequence_id, item_position, payload_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      sessionId,
      ts,
      event.type,
      event.cardId ?? null,
      event.sequenceId ?? null,
      event.itemPosition ?? null,
      event.payload ? JSON.stringify(event.payload) : null,
    )
  }
}

function toAttempt(row: AttemptRow): Attempt | null {
  if (!row.payload_json) {
    return null
  }

  try {
    const payload: unknown = JSON.parse(row.payload_json)

    if (typeof payload !== 'object' || payload === null) {
      return null
    }

    const { audioPath, durationMs } = payload as Record<string, unknown>

    if (typeof audioPath !== 'string' || typeof durationMs !== 'number') {
      return null
    }

    return {
      id: row.id,
      ts: row.ts,
      word: row.word,
      audioPath,
      durationMs,
    }
  } catch {
    return null
  }
}
