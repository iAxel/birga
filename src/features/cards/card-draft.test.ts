import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { deleteMedia, storeMedia } from '@/db/media'
import { BoardsRepository } from '@/db/repositories/boards.repository'
import { CardsRepository } from '@/db/repositories/cards.repository'
import { migratedDatabase } from '@/db/testing/migrated-database'
import { type CardDraft, saveCard } from '@/features/cards/card-draft'

jest.mock('@/db/media', () => ({
  storeMedia: jest.fn(async (uri: string) => `media/cards/stored-${uri.split('/').pop()}`),
  deleteMedia: jest.fn(),
  mediaUri: jest.fn((path: string) => `file:///documents/${path}`),
}))

async function setUp(): Promise<{ cards: CardsRepository; boardId: number }> {
  const db = await migratedDatabase()
  const boardId = await new BoardsRepository(db).create('Ovqat')

  return {
    cards: new CardsRepository(db),
    boardId,
  }
}

describe('saveCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('stores captured media and creates the card with the stored paths', async () => {
    const { cards, boardId } = await setUp()
    const draft: CardDraft = {
      boardId,
      text: 'suv',
      image: {
        kind: 'captured',
        uri: 'file:///cache/cup.jpg',
      },
      audio: {
        kind: 'captured',
        uri: 'file:///cache/suv.m4a',
      },
    }

    await saveCard(cards, draft, null)

    const [card] = await cards.listByBoard(boardId)

    expect(card).toMatchObject({
      text: 'suv',
      imagePath: 'media/cards/stored-cup.jpg',
      audioPath: 'media/cards/stored-suv.m4a',
    })
    expect(deleteMedia).not.toHaveBeenCalled()
  })

  test('deletes only the files an edit replaced', async () => {
    const { cards, boardId } = await setUp()
    const id = await cards.create({
      boardId,
      text: 'suv',
      imagePath: 'media/cards/cup.jpg',
      audioPath: 'media/cards/old.m4a',
    })
    const original = await cards.get(id)

    await saveCard(
      cards,
      {
        boardId,
        text: 'suv',
        image: {
          kind: 'stored',
          path: 'media/cards/cup.jpg',
        },
        audio: {
          kind: 'captured',
          uri: 'file:///cache/new.m4a',
        },
      },
      original,
    )

    expect(deleteMedia).toHaveBeenCalledTimes(1)
    expect(deleteMedia).toHaveBeenCalledWith('media/cards/old.m4a')
    expect((await cards.get(id))?.audioPath).toBe('media/cards/stored-new.m4a')
  })

  test('removes the files it stored when the card cannot be written', async () => {
    const { cards } = await setUp()
    const draft: CardDraft = {
      boardId: 999,
      text: 'suv',
      image: null,
      audio: {
        kind: 'captured',
        uri: 'file:///cache/suv.m4a',
      },
    }

    await expect(saveCard(cards, draft, null)).rejects.toThrow('FOREIGN KEY constraint failed')

    expect(storeMedia).toHaveBeenCalledTimes(1)
    expect(deleteMedia).toHaveBeenCalledWith('media/cards/stored-suv.m4a')
  })

  test('refuses a card without the voice or with a blank word', async () => {
    const { cards, boardId } = await setUp()

    await expect(
      saveCard(
        cards,
        {
          boardId,
          text: 'suv',
          image: null,
          audio: null,
        },
        null,
      ),
    ).rejects.toThrow('CARD_DRAFT_INCOMPLETE')

    await expect(
      saveCard(
        cards,
        {
          boardId,
          text: '  ',
          image: null,
          audio: {
            kind: 'captured',
            uri: 'file:///cache/suv.m4a',
          },
        },
        null,
      ),
    ).rejects.toThrow('CARD_DRAFT_INCOMPLETE')

    expect(storeMedia).not.toHaveBeenCalled()
  })
})
