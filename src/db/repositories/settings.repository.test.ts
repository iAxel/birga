import { describe, expect, test } from '@jest/globals'
import { migrate } from '@/db/migrate'
import { migrations } from '@/db/migrations'
import { DEFAULT_SETTINGS, SettingsRepository } from '@/db/repositories/settings.repository'
import { NodeDatabase } from '@/db/testing/node-database'

async function createRepository(): Promise<{ db: NodeDatabase; settings: SettingsRepository }> {
  const db = new NodeDatabase()

  await migrate(db, migrations)

  return {
    db,
    settings: new SettingsRepository(db),
  }
}

describe('SettingsRepository', () => {
  test('keeps the pause game hidden until the parent turns it on', async () => {
    const { settings } = await createRepository()

    expect(await settings.load()).toEqual(DEFAULT_SETTINGS)
    expect(DEFAULT_SETTINGS.pauseGameEnabled).toBe(false)
  })

  test('returns a saved value and overwrites it on the next save', async () => {
    const { settings } = await createRepository()

    await settings.save('pauseGameEnabled', true)

    expect((await settings.load()).pauseGameEnabled).toBe(true)

    await settings.save('pauseGameEnabled', false)

    expect((await settings.load()).pauseGameEnabled).toBe(false)
  })

  test('falls back to the default for a malformed or wrongly typed value', async () => {
    const { db, settings } = await createRepository()

    await db.execAsync("INSERT INTO settings (key, value) VALUES ('pauseGameEnabled', 'yes please')")

    expect((await settings.load()).pauseGameEnabled).toBe(false)

    await db.execAsync("UPDATE settings SET value = '1' WHERE key = 'pauseGameEnabled'")

    expect((await settings.load()).pauseGameEnabled).toBe(false)
  })
})
