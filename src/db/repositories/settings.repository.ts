import type { Database } from '@/db/database'
import type { SettingRow } from '@/db/schema'

export const CARDS_PER_SCREEN_OPTIONS = [2, 4, 6] as const

export type CardsPerScreen = (typeof CARDS_PER_SCREEN_OPTIONS)[number]

export const DEBOUNCE_SECONDS_OPTIONS = [4, 8, 12, 16] as const

export type DebounceSeconds = (typeof DEBOUNCE_SECONDS_OPTIONS)[number]

export const PAUSE_WINDOW_SECONDS_OPTIONS = [3, 5, 8] as const

export type PauseWindowSeconds = (typeof PAUSE_WINDOW_SECONDS_OPTIONS)[number]

/** SPEC §3: the rounds a game gives before it goes quiet until the next session. Fewer is a shorter turn at the tab. */
export const ROUNDS_PER_GAME_OPTIONS = [3, 5, 8] as const

export type RoundsPerGame = (typeof ROUNDS_PER_GAME_OPTIONS)[number]

/** How far above the room a sound has to be to count as the child's; a smaller number listens more readily. */
export const DETECTION_MARGIN_DB_OPTIONS = [6, 9, 12, 15] as const

export type DetectionMarginDb = (typeof DETECTION_MARGIN_DB_OPTIONS)[number]

export const SESSION_MINUTES_OPTIONS = [5, 10, 15] as const

export type SessionMinutes = (typeof SESSION_MINUTES_OPTIONS)[number]

/** 0 switches the break off. */
export const MIN_BREAK_MINUTES_OPTIONS = [0, 15, 30, 60] as const

export type MinBreakMinutes = (typeof MIN_BREAK_MINUTES_OPTIONS)[number]

/** What the parent can adjust (SPEC §5). A key missing from the table means its default. */
export interface Settings {
  pauseGameEnabled: boolean
  cardsPerScreen: CardsPerScreen
  debounceSeconds: DebounceSeconds
  /** How long the pause game waits for the child before it says the item itself (SPEC §3). */
  pauseWindowSeconds: PauseWindowSeconds
  /** How many rounds a game gives before the tab goes quiet until the next session (SPEC §3). */
  roundsPerGame: RoundsPerGame
  /** How far above the room the child has to sound for the pause game to count it (SPEC §3). */
  detectionMarginDb: DetectionMarginDb
  /** The soft glow behind a filled pause. */
  rewardGlow: boolean
  /** The sparks that rise once over a filled pause. */
  rewardSparks: boolean
  sessionMinutes: SessionMinutes
  minBreakMinutes: MinBreakMinutes
  /** The parent's recorded "Xayr!" for the end of a session, relative to the document directory; optional. */
  goodbyeAudioPath: string | null
  /** The child's name as the parent typed it, for the start screen; empty until set. */
  childName: string
  /** The first-launch onboarding was completed; it is never shown again. */
  onboardingDone: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  pauseGameEnabled: false,
  cardsPerScreen: 4,
  debounceSeconds: 8,
  pauseWindowSeconds: 5,
  roundsPerGame: 5,
  detectionMarginDb: 12,
  rewardGlow: true,
  rewardSparks: true,
  sessionMinutes: 10,
  minBreakMinutes: 30,
  goodbyeAudioPath: null,
  childName: '',
  onboardingDone: false,
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
      pauseWindowSeconds: this.#_readOneOf(
        stored.get('pauseWindowSeconds'),
        PAUSE_WINDOW_SECONDS_OPTIONS,
        DEFAULT_SETTINGS.pauseWindowSeconds,
      ),
      roundsPerGame: this.#_readOneOf(stored.get('roundsPerGame'), ROUNDS_PER_GAME_OPTIONS, DEFAULT_SETTINGS.roundsPerGame),
      detectionMarginDb: this.#_readOneOf(
        stored.get('detectionMarginDb'),
        DETECTION_MARGIN_DB_OPTIONS,
        DEFAULT_SETTINGS.detectionMarginDb,
      ),
      rewardGlow: this.#_readBoolean(stored.get('rewardGlow'), DEFAULT_SETTINGS.rewardGlow),
      rewardSparks: this.#_readBoolean(stored.get('rewardSparks'), DEFAULT_SETTINGS.rewardSparks),
      sessionMinutes: this.#_readOneOf(stored.get('sessionMinutes'), SESSION_MINUTES_OPTIONS, DEFAULT_SETTINGS.sessionMinutes),
      minBreakMinutes: this.#_readOneOf(
        stored.get('minBreakMinutes'),
        MIN_BREAK_MINUTES_OPTIONS,
        DEFAULT_SETTINGS.minBreakMinutes,
      ),
      goodbyeAudioPath: this.#_readString(stored.get('goodbyeAudioPath')),
      childName: this.#_readString(stored.get('childName')) ?? DEFAULT_SETTINGS.childName,
      onboardingDone: this.#_readBoolean(stored.get('onboardingDone'), DEFAULT_SETTINGS.onboardingDone),
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

  #_readString(raw: string | undefined): string | null {
    const value = this.#_parse(raw)

    if (typeof value !== 'string') {
      return null
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
