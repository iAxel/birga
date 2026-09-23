import { type SQLiteDatabase, SQLiteProvider } from 'expo-sqlite'
import type { PropsWithChildren, ReactElement } from 'react'
import { migrate } from '@/db/migrate'
import { migrations } from '@/db/migrations'

const DATABASE_NAME = 'birga.db'

/**
 * Opens the app database and migrates it before rendering children, which read it with useSQLiteContext().
 *
 * SQLiteProvider is memoised on its own props and ignores `children`, so a children element built again above it is
 * dropped: never pass a value that changes over time through this provider, use a context below it instead.
 */
export function DatabaseProvider({ children }: PropsWithChildren): ReactElement {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
      {children}
    </SQLiteProvider>
  )
}

/** Must stay a module-level function: SQLiteProvider reopens the database whenever onInit changes identity. */
async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL')

  await migrate(db, migrations)
}
