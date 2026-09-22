import type { Database } from '@/db/database'
import type { EventType } from '@/db/schema'

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
