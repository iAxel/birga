import { describe, expect, test } from '@jest/globals'
import { EventsRepository } from '@/db/repositories/events.repository'
import { SessionsRepository } from '@/db/repositories/sessions.repository'
import type { EventRow, SessionRow } from '@/db/schema'
import { migratedDatabase } from '@/db/testing/migrated-database'
import type { NodeDatabase } from '@/db/testing/node-database'

async function setUp(): Promise<{ db: NodeDatabase; events: EventsRepository; sessions: SessionsRepository }> {
  const db = await migratedDatabase()
  const events = new EventsRepository(db)

  return {
    db,
    events,
    sessions: new SessionsRepository(db, events),
  }
}

async function sessionEvents(db: NodeDatabase): Promise<Pick<EventRow, 'session_id' | 'ts' | 'type' | 'payload_json'>[]> {
  return db.getAllAsync('SELECT session_id, ts, type, payload_json FROM events ORDER BY id')
}

describe('SessionsRepository', () => {
  test('logs the start and the end of a session with its reason', async () => {
    const { db, sessions } = await setUp()

    const id = await sessions.start(1000)

    await sessions.end(id, 'timer', 601_000)

    await sessions.end(id, 'parent_exit', 700_000)

    expect(await db.getFirstAsync<SessionRow>('SELECT * FROM sessions')).toEqual({
      id,
      started_at: 1000,
      ended_at: 601_000,
      end_reason: 'timer',
    })
    expect(await sessionEvents(db)).toEqual([
      {
        session_id: id,
        ts: 1000,
        type: 'session_start',
        payload_json: null,
      },
      {
        session_id: id,
        ts: 601_000,
        type: 'session_end',
        payload_json: '{"reason":"timer"}',
      },
    ])
  })

  test('closes sessions the app died in at their last logged moment', async () => {
    const { db, events, sessions } = await setUp()
    const withTaps = await sessions.start(1000)
    const withoutTaps = await sessions.start(5000)

    await events.log(
      withTaps,
      {
        type: 'request_verbal_attempt',
      },
      3000,
    )

    await sessions.closeInterrupted()

    expect(await db.getAllAsync('SELECT id, ended_at, end_reason FROM sessions ORDER BY id')).toEqual([
      {
        id: withTaps,
        ended_at: 3000,
        end_reason: 'app_killed',
      },
      {
        id: withoutTaps,
        ended_at: 5000,
        end_reason: 'app_killed',
      },
    ])
  })

  test('counts the break only from sessions that ran their full time', async () => {
    const { sessions } = await setUp()

    expect(await sessions.lastTimerEndedAt()).toBeNull()

    await sessions.end(await sessions.start(0), 'timer', 600_000)

    await sessions.end(await sessions.start(700_000), 'parent_exit', 800_000)

    expect(await sessions.lastTimerEndedAt()).toBe(600_000)
  })
})
