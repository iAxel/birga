import { describe, expect, test } from '@jest/globals'
import { DEFAULT_SETTINGS, SettingsRepository } from '@/db/repositories/settings.repository'
import { migratedDatabase } from '@/db/testing/migrated-database'
import type { NodeDatabase } from '@/db/testing/node-database'

async function createRepository(): Promise<{ db: NodeDatabase; settings: SettingsRepository }> {
  const db = await migratedDatabase()

  return {
    db,
    settings: new SettingsRepository(db),
  }
}

describe('SettingsRepository', () => {
  test('starts with four cards, an 8 s pause, 10 min sessions, a 30 min break, no pause game, no name, onboarding due', async () => {
    const { settings } = await createRepository()

    expect(await settings.load()).toEqual({
      pauseGameEnabled: false,
      cardsPerScreen: 4,
      debounceSeconds: 8,
      pauseWindowSeconds: 5,
      rewardGlow: true,
      rewardSparks: true,
      sessionMinutes: 10,
      minBreakMinutes: 30,
      goodbyeAudioPath: null,
      childName: '',
      onboardingDone: false,
    })
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

  test('keeps only values from the offered options', async () => {
    const { db, settings } = await createRepository()

    await settings.save('cardsPerScreen', 6)

    await db.execAsync("INSERT INTO settings (key, value) VALUES ('debounceSeconds', '5')")

    expect(await settings.load()).toMatchObject({
      cardsPerScreen: 6,
      debounceSeconds: 8,
    })
  })

  test('stores the goodbye recording and clears it again', async () => {
    const { settings } = await createRepository()

    await settings.save('goodbyeAudioPath', 'media/phrases/xayr.m4a')

    expect((await settings.load()).goodbyeAudioPath).toBe('media/phrases/xayr.m4a')

    await settings.save('goodbyeAudioPath', null)

    expect((await settings.load()).goodbyeAudioPath).toBeNull()
  })

  test('remembers that the onboarding was completed', async () => {
    const { settings } = await createRepository()

    await settings.save('onboardingDone', true)

    expect((await settings.load()).onboardingDone).toBe(true)
  })

  test("keeps the child's name exactly as typed", async () => {
    const { settings } = await createRepository()

    await settings.save('childName', ' Сулаймон ')

    expect((await settings.load()).childName).toBe(' Сулаймон ')
  })
})
