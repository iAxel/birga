import type { SQLiteBindValue, SQLiteRunResult } from 'expo-sqlite'

/**
 * The part of expo-sqlite's SQLiteDatabase the app uses, so migrations and repositories also run on node:sqlite in tests.
 * Transactions go through withTransactionAsync: withExclusiveTransactionAsync opens a second connection where foreign keys
 * are not enforced.
 */
export interface Database {
  execAsync(source: string): Promise<void>
  runAsync(source: string, ...params: SQLiteBindValue[]): Promise<SQLiteRunResult>
  getFirstAsync<T>(source: string, ...params: SQLiteBindValue[]): Promise<T | null>
  getAllAsync<T>(source: string, ...params: SQLiteBindValue[]): Promise<T[]>
  withTransactionAsync(task: () => Promise<void>): Promise<void>
}
