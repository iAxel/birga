import { describe, expect, test } from '@jest/globals'
import { BoardsRepository } from '@/db/repositories/boards.repository'
import { CardsRepository } from '@/db/repositories/cards.repository'
import { migratedDatabase } from '@/db/testing/migrated-database'

interface Fixture {
  boards: BoardsRepository
  cards: CardsRepository
  boardId: number
  ids: Record<string, number>
}

async function boardWithCards(words: string[]): Promise<Fixture> {
  const db = await migratedDatabase()
  const boards = new BoardsRepository(db)
  const cards = new CardsRepository(db)
  const boardId = await boards.create('Ovqat')
  const ids: Record<string, number> = {}

  for (const word of words) {
    ids[word] = await cards.create({
      boardId,
      text: word,
      imagePath: null,
      audioPath: `${word}.m4a`,
      audioLevels: null,
    })
  }

  return {
    boards,
    cards,
    boardId,
    ids,
  }
}

async function wordsOf(cards: CardsRepository, boardId: number): Promise<string[]> {
  const boardCards = await cards.listByBoard(boardId)

  return boardCards.map((card) => card.text)
}

describe('CardsRepository', () => {
  test('keeps cards in the order they were added', async () => {
    const { cards, boardId } = await boardWithCards(['suv', 'non', 'yana'])

    expect(await wordsOf(cards, boardId)).toEqual(['suv', 'non', 'yana'])
  })

  test('stores the word exactly as typed', async () => {
    const { cards, boardId } = await boardWithCards([])

    const id = await cards.create({
      boardId,
      text: 'Сув ',
      imagePath: 'media/cards/cup.jpg',
      audioPath: 'media/cards/suv.m4a',
      audioLevels: null,
    })

    expect(await cards.get(id)).toEqual({
      id,
      boardId,
      text: 'Сув ',
      imagePath: 'media/cards/cup.jpg',
      audioPath: 'media/cards/suv.m4a',
      audioLevels: null,
      isArchived: false,
    })
  })

  test('moves a card by one place and ignores moves past either end', async () => {
    const { cards, boardId, ids } = await boardWithCards(['suv', 'non', 'yana'])

    await cards.move(ids.yana, -1)

    expect(await wordsOf(cards, boardId)).toEqual(['suv', 'yana', 'non'])

    await cards.move(ids.suv, -1)

    await cards.move(ids.non, 1)

    expect(await wordsOf(cards, boardId)).toEqual(['suv', 'yana', 'non'])
  })

  test('leaves archived cards out of the board but keeps them', async () => {
    const { cards, boardId, ids } = await boardWithCards(['suv', 'non', 'yana'])

    await cards.archive(ids.non)

    expect(await wordsOf(cards, boardId)).toEqual(['suv', 'yana'])
    expect((await cards.get(ids.non))?.text).toBe('non')
  })

  test('puts a card moved to another board at the end of that board', async () => {
    const { boards, cards, boardId, ids } = await boardWithCards(['suv', 'non'])
    const playBoardId = await boards.create("O'yin")

    await cards.create({
      boardId: playBoardId,
      text: 'ber',
      imagePath: null,
      audioPath: 'ber.m4a',
      audioLevels: null,
    })

    await cards.update(ids.suv, {
      boardId: playBoardId,
      text: 'suv',
      imagePath: null,
      audioPath: 'suv.m4a',
      audioLevels: null,
    })

    expect(await wordsOf(cards, boardId)).toEqual(['non'])
    expect(await wordsOf(cards, playBoardId)).toEqual(['ber', 'suv'])
  })

  test('keeps the shape of a recording and ignores a damaged one', async () => {
    const db = await migratedDatabase()
    const cards = new CardsRepository(db)
    const boardId = await new BoardsRepository(db).create('Ovqat')
    const id = await cards.create({
      boardId,
      text: 'suv',
      imagePath: null,
      audioPath: 'suv.m4a',
      audioLevels: [0.125, 0.5, 1],
    })

    expect((await cards.get(id))?.audioLevels).toEqual([0.13, 0.5, 1])

    await db.execAsync(`UPDATE cards SET audio_levels = 'not json' WHERE id = ${id}`)

    expect((await cards.get(id))?.audioLevels).toBeNull()
  })
})
