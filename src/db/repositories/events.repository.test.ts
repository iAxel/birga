import { describe, expect, test } from '@jest/globals'
import { BoardsRepository } from '@/db/repositories/boards.repository'
import { CardsRepository } from '@/db/repositories/cards.repository'
import { EventsRepository } from '@/db/repositories/events.repository'
import { SequencesRepository } from '@/db/repositories/sequences.repository'
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

  test('counts as a loop only the taps that repeated a resting card, not the ones made while another was on screen', async () => {
    const db = await migratedDatabase()
    const cards = new CardsRepository(db)
    const boardId = await new BoardsRepository(db).create('Ovqat')
    const water = await cards.create({ boardId, text: 'suv', imagePath: null, audioPath: 'suv.m4a', audioLevels: null })
    const more = await cards.create({ boardId, text: 'yana', imagePath: null, audioPath: 'yana.m4a', audioLevels: null })
    const events = new EventsRepository(db)

    for (const ts of [1000, 2000, 3000]) {
      await events.log(null, { type: 'request_tap_debounced', cardId: water, payload: { reason: 'repeat', word: 'suv' } }, ts)
      await events.log(null, { type: 'request_tap_debounced', cardId: more, payload: { reason: 'busy', word: 'yana' } }, ts)
    }

    expect(await events.repeatsByCard(0, 10_000)).toEqual([{ cardId: water, cardText: 'suv', count: 3 }])
  })

  test('reports when the events of a type happened', async () => {
    const db = await migratedDatabase()
    const events = new EventsRepository(db)

    await events.log(null, { type: 'request_tap' }, 3000)
    await events.log(null, { type: 'request_tap' }, 1000)
    await events.log(null, { type: 'session_start' }, 2000)

    expect(await events.timesOf('request_tap', 0, 5000)).toEqual([1000, 3000])
  })

  test('counts a renamed card by the word each tap saw, and an older tap by the word the card has now', async () => {
    const db = await migratedDatabase()
    const cards = new CardsRepository(db)
    const boardId = await new BoardsRepository(db).create('Ovqat')
    const card = { boardId, imagePath: null, audioPath: 'suv.m4a', audioLevels: null }
    const cardId = await cards.create({ ...card, text: 'suv' })
    const events = new EventsRepository(db)

    for (const ts of [1000, 2000, 3000]) {
      await events.log(null, { type: 'request_tap', cardId, payload: { word: 'suv' } }, ts)
    }

    await cards.update(cardId, { ...card, text: 'choy' })

    await events.log(null, { type: 'request_tap', cardId, payload: { word: 'choy' } }, 4000)
    await events.log(null, { type: 'request_tap', cardId }, 5000)

    expect(await events.countsByCard('request_tap', 0, 10_000)).toEqual([
      { cardId, cardText: 'suv', count: 3 },
      { cardId, cardText: 'choy', count: 2 },
    ])
  })

  test('names an attempt by the word its event kept, however the sequence changed since', async () => {
    const db = await migratedDatabase()
    const sequences = new SequencesRepository(db)
    const sequenceId = await sequences.create('Sonlar')
    const item = { sequenceId, symbol: null, audioLevels: null, imagePath: null }

    for (const text of ['bir', 'ikki', 'uch']) {
      await sequences.createItem({ ...item, text, audioPath: `${text}.m4a` })
    }

    const [first, second] = await sequences.listItems(sequenceId)
    const events = new EventsRepository(db)

    await events.log(
      null,
      {
        type: 'attempt_recorded',
        sequenceId,
        itemPosition: second.position,
        payload: {
          audioPath: 'media/attempts/ikki.m4a',
          durationMs: 700,
          word: 'ikki',
          itemId: second.id,
        },
      },
      1000,
    )

    await sequences.moveItem(first.id, 1)

    expect((await events.listAttempts(10)).map((attempt) => attempt.word)).toEqual(['ikki'])
  })
})
