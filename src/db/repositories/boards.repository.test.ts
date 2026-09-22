import { describe, expect, test } from '@jest/globals'
import { BoardsRepository } from '@/db/repositories/boards.repository'
import { migratedDatabase } from '@/db/testing/migrated-database'

describe('BoardsRepository', () => {
  test('makes the first board active and adds the next ones inactive', async () => {
    const boards = new BoardsRepository(await migratedDatabase())

    const food = await boards.create('Ovqat')
    const play = await boards.create("O'yin")

    expect(await boards.list()).toEqual([
      {
        id: food,
        title: 'Ovqat',
        isActive: true,
      },
      {
        id: play,
        title: "O'yin",
        isActive: false,
      },
    ])
  })

  test('switches the active board so that exactly one stays active', async () => {
    const boards = new BoardsRepository(await migratedDatabase())

    await boards.create('Ovqat')

    const play = await boards.create("O'yin")

    await boards.activate(play)

    await boards.activate(play)

    expect((await boards.list()).map((board) => board.isActive)).toEqual([false, true])
  })

  test('renames a board', async () => {
    const boards = new BoardsRepository(await migratedDatabase())

    const id = await boards.create('Ovqat')

    await boards.rename(id, 'Ichimliklar')

    expect((await boards.get(id))?.title).toBe('Ichimliklar')
  })
})
