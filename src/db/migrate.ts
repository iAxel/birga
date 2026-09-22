import type { Database } from '@/db/database'

/** One schema change. An applied migration is never edited: a fix goes into a new version. */
export interface Migration {
  version: number
  name: string
  sql: string
}

/**
 * Brings the schema to the latest version. Each pending migration runs in its own transaction together with the
 * user_version bump. Foreign keys are off while migrating, as SQLite requires for altering tables, and on afterwards.
 */
export async function migrate(db: Database, migrations: Migration[]): Promise<void> {
  assertSequential(migrations)

  const currentVersion = await readUserVersion(db)

  if (currentVersion > migrations.length) {
    throw new Error('DATABASE_NEWER_THAN_APP')
  }

  await db.execAsync('PRAGMA foreign_keys = OFF')

  try {
    for (const migration of migrations.slice(currentVersion)) {
      await applyMigration(db, migration)
    }
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON')
  }
}

function assertSequential(migrations: Migration[]): void {
  for (const [index, migration] of migrations.entries()) {
    if (migration.version !== index + 1) {
      throw new Error('MIGRATIONS_NOT_SEQUENTIAL')
    }
  }
}

async function readUserVersion(db: Database): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')

  return row?.user_version ?? 0
}

async function applyMigration(db: Database, migration: Migration): Promise<void> {
  try {
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.sql)

      await assertNoForeignKeyViolations(db)

      await db.execAsync(`PRAGMA user_version = ${migration.version}`)
    })
  } catch (err) {
    throw new Error(`MIGRATION_FAILED: ${migration.version}-${migration.name}`, {
      cause: err,
    })
  }
}

async function assertNoForeignKeyViolations(db: Database): Promise<void> {
  const violation = await db.getFirstAsync('PRAGMA foreign_key_check')

  if (violation) {
    throw new Error('FOREIGN_KEY_VIOLATION')
  }
}
