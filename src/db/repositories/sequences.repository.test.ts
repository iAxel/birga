import { describe, expect, test } from '@jest/globals'
import { type SequenceItemInput, SequencesRepository } from '@/db/repositories/sequences.repository'
import { migratedDatabase } from '@/db/testing/migrated-database'

async function sequenceWithItems(words: string[]): Promise<{ sequences: SequencesRepository; sequenceId: number }> {
  const db = await migratedDatabase()
  const sequences = new SequencesRepository(db)
  const sequenceId = await sequences.create('Sonlar')

  for (const word of words) {
    await sequences.createItem(item(sequenceId, word))
  }

  return {
    sequences,
    sequenceId,
  }
}

function item(sequenceId: number, text: string, overrides: Partial<SequenceItemInput> = {}): SequenceItemInput {
  return {
    sequenceId,
    text,
    symbol: null,
    audioPath: `${text}.m4a`,
    audioLevels: null,
    imagePath: null,
    ...overrides,
  }
}

async function wordsOf(sequences: SequencesRepository, sequenceId: number): Promise<string[]> {
  const items = await sequences.listItems(sequenceId)

  return items.map((entry) => entry.text)
}

describe('SequencesRepository', () => {
  test('keeps the shape of the recording with the item', async () => {
    const { sequences, sequenceId } = await sequenceWithItems([])
    const id = await sequences.createItem(item(sequenceId, 'bir', { audioLevels: [0.1, 0.72, 0.5] }))

    expect((await sequences.getItem(id))?.audioLevels).toEqual([0.1, 0.72, 0.5])

    await sequences.updateItem(id, item(sequenceId, 'bir', { audioLevels: null }))

    expect((await sequences.getItem(id))?.audioLevels).toBeNull()
  })

  test('makes the first sequence the active one and switches on request', async () => {
    const db = await migratedDatabase()
    const sequences = new SequencesRepository(db)
    const numbers = await sequences.create('Sonlar')
    const phrases = await sequences.create('Iboralar')

    expect(await sequences.getActive()).toMatchObject({ id: numbers, isActive: true })

    await sequences.activate(phrases)

    expect(await sequences.getActive()).toMatchObject({ id: phrases })
    expect(await sequences.list()).toEqual([
      { id: numbers, title: 'Sonlar', isActive: false },
      { id: phrases, title: 'Iboralar', isActive: true },
    ])
  })

  test('keeps items in the order they were added and stores the symbol', async () => {
    const { sequences, sequenceId } = await sequenceWithItems(['bir', 'ikki'])

    await sequences.createItem(item(sequenceId, 'uch', { symbol: '3' }))

    expect(await wordsOf(sequences, sequenceId)).toEqual(['bir', 'ikki', 'uch'])
    expect((await sequences.listItems(sequenceId))[2]).toMatchObject({
      text: 'uch',
      symbol: '3',
      position: 2,
      audioPath: 'uch.m4a',
    })
  })

  test('moves an item past its neighbour and stops at the ends', async () => {
    const { sequences, sequenceId } = await sequenceWithItems(['bir', 'ikki', 'uch'])
    const [first, second] = await sequences.listItems(sequenceId)

    await sequences.moveItem(second.id, -1)

    expect(await wordsOf(sequences, sequenceId)).toEqual(['ikki', 'bir', 'uch'])

    await sequences.moveItem(first.id, 1)

    expect(await wordsOf(sequences, sequenceId)).toEqual(['ikki', 'uch', 'bir'])

    await sequences.moveItem(first.id, 1)

    expect(await wordsOf(sequences, sequenceId)).toEqual(['ikki', 'uch', 'bir'])
  })

  test('leaves the places of the other items alone when one is deleted, so the log keeps its meaning', async () => {
    const { sequences, sequenceId } = await sequenceWithItems(['bir', 'ikki', 'uch'])
    const [, second] = await sequences.listItems(sequenceId)

    await sequences.deleteItem(second.id)

    expect(await sequences.listItems(sequenceId)).toMatchObject([
      { text: 'bir', position: 0 },
      { text: 'uch', position: 2 },
    ])
  })

  test('sends an item moved to another sequence to its end', async () => {
    const { sequences, sequenceId } = await sequenceWithItems(['bir', 'ikki'])
    const other = await sequences.create('Iboralar')
    await sequences.createItem(item(other, 'Men'))
    const [first] = await sequences.listItems(sequenceId)

    await sequences.updateItem(first.id, item(other, 'bir'))

    expect(await wordsOf(sequences, other)).toEqual(['Men', 'bir'])
    expect(await wordsOf(sequences, sequenceId)).toEqual(['ikki'])
  })
})
