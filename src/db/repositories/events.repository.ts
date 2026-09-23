import type { Database } from '@/db/database'
import type { EventType } from '@/db/schema'

interface AttemptRow {
  id: number
  ts: number
  card_text: string | null
  payload_json: string | null
}

/** An attempt of the child the parent recorded, as the log screen lists it (SPEC §5). */
export interface Attempt {
  id: number
  /** When it was recorded. */
  ts: number
  /** The word of the card it belongs to; null when the card is gone or it came from the pause game. */
  cardText: string | null
  audioPath: string
  durationMs: number
}

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

  /** The recorded attempts, newest first. Rows whose payload is damaged are left out rather than shown empty. */
  async listAttempts(limit: number): Promise<Attempt[]> {
    const rows = await this.#_db.getAllAsync<AttemptRow>(
      `SELECT events.id, events.ts, events.payload_json, cards.text AS card_text
       FROM events
       LEFT JOIN cards ON cards.id = events.card_id
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
      cardText: row.card_text,
      audioPath,
      durationMs,
    }
  } catch {
    return null
  }
}
