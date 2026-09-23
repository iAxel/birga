import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { deleteMedia, storeMedia } from '@/db/media'
import { SequencesRepository } from '@/db/repositories/sequences.repository'
import { migratedDatabase } from '@/db/testing/migrated-database'
import { saveSequenceItem, type SequenceItemDraft } from '@/features/sequences/sequence-item-draft'

jest.mock('@/db/media', () => ({
  storeMedia: jest.fn(async (uri: string) => `media/sequences/stored-${uri.split('/').pop()}`),
  deleteMedia: jest.fn(),
  mediaUri: jest.fn((path: string) => `file:///documents/${path}`),
}))

async function setUp(): Promise<{ sequences: SequencesRepository; sequenceId: number }> {
  const db = await migratedDatabase()
  const sequences = new SequencesRepository(db)

  return {
    sequences,
    sequenceId: await sequences.create('Sonlar'),
  }
}

function draft(sequenceId: number, overrides: Partial<SequenceItemDraft> = {}): SequenceItemDraft {
  return {
    sequenceId,
    text: 'bir',
    symbol: '1',
    image: null,
    audioLevels: null,
    audio: {
      kind: 'captured',
      uri: 'file:///cache/bir.m4a',
    },
    ...overrides,
  }
}

describe('saveSequenceItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('stores the captured voice and writes the item with the stored path', async () => {
    const { sequences, sequenceId } = await setUp()

    await saveSequenceItem(sequences, draft(sequenceId), null)

    expect(await sequences.listItems(sequenceId)).toMatchObject([
      {
        text: 'bir',
        symbol: '1',
        audioPath: 'media/sequences/stored-bir.m4a',
        imagePath: null,
      },
    ])
    expect(deleteMedia).not.toHaveBeenCalled()
  })

  test('keeps a blank symbol out of the database', async () => {
    const { sequences, sequenceId } = await setUp()

    await saveSequenceItem(sequences, draft(sequenceId, { symbol: '  ' }), null)

    expect((await sequences.listItems(sequenceId))[0].symbol).toBeNull()
  })

  test('deletes only the file an edit replaced', async () => {
    const { sequences, sequenceId } = await setUp()
    const id = await sequences.createItem({
      sequenceId,
      text: 'bir',
      symbol: null,
      audioPath: 'media/sequences/old.m4a',
      audioLevels: null,
      imagePath: 'media/sequences/one.jpg',
    })
    const original = await sequences.getItem(id)

    await saveSequenceItem(
      sequences,
      draft(sequenceId, {
        image: {
          kind: 'stored',
          path: 'media/sequences/one.jpg',
        },
      }),
      original,
    )

    expect(storeMedia).toHaveBeenCalledTimes(1)
    expect(deleteMedia).toHaveBeenCalledWith('media/sequences/old.m4a')
    expect(deleteMedia).toHaveBeenCalledTimes(1)
  })

  test('refuses an item without a word or without the voice', async () => {
    const { sequences, sequenceId } = await setUp()

    await expect(saveSequenceItem(sequences, draft(sequenceId, { text: ' ' }), null)).rejects.toThrow(
      'SEQUENCE_ITEM_DRAFT_INCOMPLETE',
    )
    await expect(saveSequenceItem(sequences, draft(sequenceId, { audio: null }), null)).rejects.toThrow(
      'SEQUENCE_ITEM_DRAFT_INCOMPLETE',
    )
  })
})
