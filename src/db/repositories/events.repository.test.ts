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
      audioLevels: null,
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

  test('lists recorded attempts newest first, with the word of their card', async () => {
    const db = await migratedDatabase()
    const boardId = await new BoardsRepository(db).create('Ovqat')
    const cardId = await new CardsRepository(db).create({
      boardId,
      text: 'suv',
      imagePath: null,
      audioPath: 'suv.m4a',
      audioLevels: null,
    })
    const events = new EventsRepository(db)

    await events.log(
      null,
      {
        type: 'attempt_recorded',
        cardId,
        payload: {
          audioPath: 'media/attempts/first.m4a',
          durationMs: 900,
        },
      },
      1000,
    )

    await events.log(
      null,
      {
        type: 'attempt_recorded',
        cardId: null,
        payload: {
          audioPath: 'media/attempts/second.m4a',
          durationMs: 1800,
        },
      },
      2000,
    )

    expect(await events.listAttempts(10)).toEqual([
      {
        id: 2,
        ts: 2000,
        word: null,
        audioPath: 'media/attempts/second.m4a',
        durationMs: 1800,
      },
      {
        id: 1,
        ts: 1000,
        word: 'suv',
        audioPath: 'media/attempts/first.m4a',
        durationMs: 900,
      },
    ])
  })

  test('leaves out an attempt whose payload is damaged', async () => {
    const db = await migratedDatabase()
    const events = new EventsRepository(db)

    await events.log(null, { type: 'attempt_recorded' }, 1000)

    await db.execAsync("INSERT INTO events (ts, type, payload_json) VALUES (2000, 'attempt_recorded', '{\"audioPath\": 7}')")

    expect(await events.listAttempts(10)).toEqual([])
  })

  test('counts the events of a day by type, and leaves out the ones outside it', async () => {
    const db = await migratedDatabase()
    const events = new EventsRepository(db)

    await events.log(null, { type: 'request_tap' }, 1000)
    await events.log(null, { type: 'request_tap' }, 2000)
    await events.log(null, { type: 'request_verbal_attempt' }, 3000)
    await events.log(null, { type: 'request_tap' }, 9000)

    expect(await events.countsByType(0, 9000)).toEqual({
      request_tap: 2,
      request_verbal_attempt: 1,
    })
  })

  test('counts the events of a type per card, most often first', async () => {
    const db = await migratedDatabase()
    const cards = new CardsRepository(db)
    const boardId = await new BoardsRepository(db).create('Ovqat')
    const water = await cards.create({ boardId, text: 'suv', imagePath: null, audioPath: 'suv.m4a', audioLevels: null })
    const more = await cards.create({ boardId, text: 'yana', imagePath: null, audioPath: 'yana.m4a', audioLevels: null })
    const events = new EventsRepository(db)

    await events.log(null, { type: 'request_tap', cardId: water }, 1000)
    await events.log(null, { type: 'request_tap', cardId: water }, 2000)
    await events.log(null, { type: 'request_tap', cardId: more }, 3000)
    await events.log(null, { type: 'request_tap_debounced', cardId: water }, 4000)
    await events.log(null, { type: 'request_tap', cardId: water }, 99_000)

    expect(await events.countsByCard('request_tap', 0, 10_000)).toEqual([
      { cardId: water, cardText: 'suv', count: 2 },
      { cardId: more, cardText: 'yana', count: 1 },
    ])
    expect(await events.countsByCard('request_tap_debounced', 0, 10_000)).toEqual([
      { cardId: water, cardText: 'suv', count: 1 },
    ])
  })

  test('reports when the events of a type happened', async () => {
    const db = await migratedDatabase()
    const events = new EventsRepository(db)

    await events.log(null, { type: 'request_tap' }, 3000)
    await events.log(null, { type: 'request_tap' }, 1000)
    await events.log(null, { type: 'session_start' }, 2000)

    expect(await events.timesOf('request_tap', 0, 5000)).toEqual([1000, 3000])
  })
})
