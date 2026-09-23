import { describe, expect, test } from '@jest/globals'
import type { Database } from '@/db/database'
import { serializedConnection, serializeTransactions } from '@/db/serialized-database'
import { migratedDatabase } from '@/db/testing/migrated-database'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function recordingDatabase(): Promise<{ database: Database; steps: string[] }> {
  const steps: string[] = []
  const db = await migratedDatabase()

  return {
    steps,
    database: serializeTransactions({
      execAsync: (source) => db.execAsync(source),
      runAsync: (source, ...params) => db.runAsync(source, ...params),
      getFirstAsync: (source, ...params) => db.getFirstAsync(source, ...params),
      getAllAsync: (source, ...params) => db.getAllAsync(source, ...params),
      withTransactionAsync: async (task) => {
        steps.push('begin')

        await task()

        steps.push('commit')
      },
    }),
  }
}

describe('serializeTransactions', () => {
  test('lets one transaction finish before the next begins', async () => {
    const { database, steps } = await recordingDatabase()

    const first = database.withTransactionAsync(async () => {
      steps.push('first step')

      await delay(20)

      steps.push('first step')
    })
    const second = database.withTransactionAsync(async () => {
      steps.push('second step')
    })

    await Promise.all([first, second])

    expect(steps).toEqual(['begin', 'first step', 'first step', 'commit', 'begin', 'second step', 'commit'])
  })

  test('queues the transactions of every screen that asks for the same connection', async () => {
    const steps: string[] = []
    const connection: Database = {
      execAsync: async () => undefined,
      runAsync: async () => ({
        lastInsertRowId: 0,
        changes: 0,
      }),
      getFirstAsync: async () => null,
      getAllAsync: async () => [],
      withTransactionAsync: async (task) => {
        steps.push('begin')

        await task()

        steps.push('commit')
      },
    }
    const board = serializedConnection(connection)
    const session = serializedConnection(connection)

    await Promise.all([
      board.withTransactionAsync(async () => {
        steps.push('board')

        await delay(20)
      }),
      session.withTransactionAsync(async () => {
        steps.push('session')
      }),
    ])

    expect(board).toBe(session)
    expect(steps).toEqual(['begin', 'board', 'commit', 'begin', 'session', 'commit'])
  })

  test('a transaction that throws does not block the ones behind it', async () => {
    const { database, steps } = await recordingDatabase()

    const failing = database.withTransactionAsync(async () => {
      throw new Error('NO')
    })
    const next = database.withTransactionAsync(async () => {
      steps.push('next')
    })

    await expect(failing).rejects.toThrow('NO')
    await next

    expect(steps).toContain('next')
  })
})
