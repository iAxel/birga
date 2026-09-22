import type { Database } from '@/db/database'
import type { SettingRow } from '@/db/schema'

export const CARDS_PER_SCREEN_OPTIONS = [2, 4, 6] as const

export type CardsPerScreen = (typeof CARDS_PER_SCREEN_OPTIONS)[number]

export const DEBOUNCE_SECONDS_OPTIONS = [4, 8, 12, 16] as const

export type DebounceSeconds = (typeof DEBOUNCE_SECONDS_OPTIONS)[number]

/** What the parent can adjust (SPEC §5). A key missing from the table means its default. */
export interface Settings {
  pauseGameEnabled: boolean
  cardsPerScreen: CardsPerScreen
  debounceSeconds: DebounceSeconds
}

export const DEFAULT_SETTINGS: Settings = {
  pauseGameEnabled: false,
  cardsPerScreen: 4,
  debounceSeconds: 8,
}

/** Settings stored as JSON values under the name of their Settings field. */
export class SettingsRepository {
  readonly #_db: Database

  constructor(db: Database) {
    this.#_db = db
  }

  /** Stored values over the defaults; a malformed value or one outside its options falls back to the default. */
  async load(): Promise<Settings> {
    const rows = await this.#_db.getAllAsync<SettingRow>('SELECT key, value FROM settings')
    const stored = new Map(rows.map((row) => [row.key, row.value]))

    return {
      pauseGameEnabled: this.#_readBoolean(stored.get('pauseGameEnabled'), DEFAULT_SETTINGS.pauseGameEnabled),
      cardsPerScreen: this.#_readOneOf(stored.get('cardsPerScreen'), CARDS_PER_SCREEN_OPTIONS, DEFAULT_SETTINGS.cardsPerScreen),
      debounceSeconds: this.#_readOneOf(
        stored.get('debounceSeconds'),
        DEBOUNCE_SECONDS_OPTIONS,
        DEFAULT_SETTINGS.debounceSeconds,
      ),
    }
  }

  async save<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
    await this.#_db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
      key,
      JSON.stringify(value),
    )
  }

  #_readBoolean(raw: string | undefined, fallback: boolean): boolean {
    const value = this.#_parse(raw)

    if (typeof value !== 'boolean') {
      return fallback
    }

    return value
  }

  #_readOneOf<T extends number>(raw: string | undefined, options: readonly T[], fallback: T): T {
    const value = this.#_parse(raw)
    const option = options.find((candidate) => candidate === value)

    if (option === undefined) {
      return fallback
    }

    return option
  }

  #_parse(raw: string | undefined): unknown {
    if (raw === undefined) {
      return undefined
    }

    try {
      return JSON.parse(raw)
    } catch {
      return undefined
    }
  }
}
