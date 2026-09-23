import type { Database } from '@/db/database'
import type { EventsRepository } from '@/db/repositories/events.repository'
import type { SessionEndReason } from '@/db/schema'

interface InterruptedSessionRow {
  id: number
  last_at: number
}

/** Sessions of child play (SPEC §4). A session without ended_at is running, or was cut off when the app died. */
export class SessionsRepository {
  readonly #_db: Database
  readonly #_events: EventsRepository

  constructor(db: Database, events: EventsRepository) {
    this.#_db = db
    this.#_events = events
  }

  /** Opens a session and logs session_start with it. */
  async start(startedAt: number): Promise<number> {
    let sessionId = 0

    await this.#_db.withTransactionAsync(async () => {
      const result = await this.#_db.runAsync('INSERT INTO sessions (started_at) VALUES (?)', startedAt)

      sessionId = result.lastInsertRowId

      await this.#_events.log(
        sessionId,
        {
          type: 'session_start',
        },
        startedAt,
      )
    })

    return sessionId
  }

  /** Closes a running session and logs session_end with the reason; a session that is already closed stays as it is. */
  async end(sessionId: number, reason: SessionEndReason, endedAt: number): Promise<void> {
    await this.#_db.withTransactionAsync(async () => {
      const result = await this.#_db.runAsync(
        'UPDATE sessions SET ended_at = ?, end_reason = ? WHERE id = ? AND ended_at IS NULL',
        endedAt,
        reason,
        sessionId,
      )

      if (result.changes === 0) {
        return
      }

      await this.#_events.log(
        sessionId,
        {
          type: 'session_end',
          payload: {
            reason,
          },
        },
        endedAt,
      )
    })
  }

  /** Closes sessions the app died in as app_killed, at their last logged moment rather than now. */
  async closeInterrupted(): Promise<void> {
    const rows = await this.#_db.getAllAsync<InterruptedSessionRow>(
      `SELECT sessions.id, COALESCE(MAX(events.ts), sessions.started_at) AS last_at
       FROM sessions
       LEFT JOIN events ON events.session_id = sessions.id
       WHERE sessions.ended_at IS NULL
       GROUP BY sessions.id`,
    )

    for (const row of rows) {
      await this.end(row.id, 'app_killed', row.last_at)
    }
  }

  /** When the last session that ran its full time ended: the minimum break counts from there. */
  async lastTimerEndedAt(): Promise<number | null> {
    const row = await this.#_db.getFirstAsync<{ ended_at: number | null }>(
      "SELECT MAX(ended_at) AS ended_at FROM sessions WHERE end_reason = 'timer'",
    )

    return row?.ended_at ?? null
  }

  /** When the last session ended, whatever ended it; null before the first one and while one is running. */
  async lastEndedAt(): Promise<number | null> {
    const row = await this.#_db.getFirstAsync<{ ended_at: number | null }>(
      'SELECT MAX(ended_at) AS ended_at FROM sessions WHERE ended_at IS NOT NULL',
    )

    return row?.ended_at ?? null
  }

  /** How many sessions started at or after `from`: parent home counts the ones of today with it. */
  async countStartedSince(from: number): Promise<number> {
    const row = await this.#_db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM sessions WHERE started_at >= ?',
      from,
    )

    return row?.count ?? 0
  }
}
