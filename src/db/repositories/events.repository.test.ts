import { describe, expect, test } from '@jest/globals'
import { BoardsRepository } from '@/db/repositories/boards.repository'
import { CardsRepository } from '@/db/repositories/cards.repository'
import { EventsRepository } from '@/db/repositories/events.repository'
import type { EventRow } from '@/db/schema'
import { migratedDatabase } from '@/db/testing/migrated-database'

describe('EventsRepository', () => {
  test('writes an event with its card and a JSON payload', async () => {
    const db = await migratedDatabase()
    const boardId = await new BoardsRepository(db).create('Ovqat')
    const cardId = await new CardsRepository(db).create({
      boardId,
      text: 'suv',
      imagePath: null,
      audioPath: 'suv.m4a',
    })

    await new EventsRepository(db).log(
      null,
      {
        type: 'request_tap_debounced',
        cardId,
        payload: {
          reason: 'repeat',
        },
      },
      1000,
    )

    expect(await db.getAllAsync<EventRow>('SELECT * FROM events')).toEqual([
      {
        id: 1,
        session_id: null,
        ts: 1000,
        type: 'request_tap_debounced',
        card_id: cardId,
        sequence_id: null,
        item_position: null,
        payload_json: '{"reason":"repeat"}',
      },
    ])
  })
})
