import type { Database } from '@/db/database'

/** The one serialized wrapper of each connection, so every screen's transactions wait in the same queue. */
const SERIALIZED = new WeakMap<Database, Database>()

/**
 * The connection with its transactions in one queue, the same wrapper however often and wherever it is asked for: a
 * queue of its own for every screen would let two screens' transactions tear each other apart just the same.
 */
export function serializedConnection(database: Database): Database {
  const known = SERIALIZED.get(database)

  if (known) {
    return known
  }

  const serialized = serializeTransactions(database)

  SERIALIZED.set(database, serialized)

  return serialized
}

/**
 * expo-sqlite runs a transaction as plain BEGIN / task / COMMIT on the one connection and does not queue them: two
 * transactions that overlap in time tear each other apart, and the second one's rollback takes the first one's work
 * with it. The parent can start two easily, by tapping two arrows on the board in a row. This wrapper lets one
 * transaction finish before the next begins; reads and single statements go straight through.
 */
export function serializeTransactions(database: Database): Database {
  let queue: Promise<unknown> = Promise.resolve()

  return {
    execAsync: (source) => database.execAsync(source),
    runAsync: (source, ...params) => database.runAsync(source, ...params),
    getFirstAsync: (source, ...params) => database.getFirstAsync(source, ...params),
    getAllAsync: (source, ...params) => database.getAllAsync(source, ...params),
    withTransactionAsync: (task) => {
      const transaction = queue.then(
        () => database.withTransactionAsync(task),
        () => database.withTransactionAsync(task),
      )

      queue = transaction.catch(() => undefined)

      return transaction
    },
  }
}
