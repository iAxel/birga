import type { Database } from '@/db/database'
import type { SettingRow } from '@/db/schema'

/** What the parent can adjust (SPEC §5). A key missing from the table means its default. */
export interface Settings {
  pauseGameEnabled: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  pauseGameEnabled: false,
}

/** Settings stored as JSON values under the name of their Settings field. */
export class SettingsRepository {
  readonly #_db: Database

  constructor(db: Database) {
    this.#_db = db
  }

  /** Stored values over the defaults; a malformed or wrongly typed value falls back to its default. */
  async load(): Promise<Settings> {
    const rows = await this.#_db.getAllAsync<SettingRow>('SELECT key, value FROM settings')
    const stored = new Map(rows.map((row) => [row.key, row.value]))

    return {
      pauseGameEnabled: this.#_readBoolean(stored.get('pauseGameEnabled'), DEFAULT_SETTINGS.pauseGameEnabled),
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
