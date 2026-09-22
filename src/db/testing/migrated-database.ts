import { migrate } from '@/db/migrate'
import { migrations } from '@/db/migrations'
import { NodeDatabase } from '@/db/testing/node-database'

/** A fresh in-memory database with every migration applied. */
export async function migratedDatabase(): Promise<NodeDatabase> {
  const db = new NodeDatabase()

  await migrate(db, migrations)

  return db
}
