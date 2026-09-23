/** SQLite has no boolean type: flags are stored as 0 or 1. */
export type SqliteFlag = 0 | 1

export interface BoardRow {
  id: number
  title: string
  position: number
  is_active: SqliteFlag
  created_at: number
}

/** Paths are relative to the app document directory; text is stored exactly as the parent typed it. */
export interface CardRow {
  id: number
  board_id: number
  text: string
  image_path: string | null
  audio_path: string
  /** Loudness of the recording as a JSON array of numbers from 0 to 1; null for cards recorded before it was stored. */
  audio_levels: string | null
  position: number
  is_archived: SqliteFlag
  created_at: number
}

export interface SequenceRow {
  id: number
  title: string
  is_active: SqliteFlag
  created_at: number
}

export interface SequenceItemRow {
  id: number
  sequence_id: number
  position: number
  text: string
  audio_path: string | null
  image_path: string | null
}

export type SessionEndReason = 'timer' | 'parent_exit' | 'app_killed'

export interface SessionRow {
  id: number
  started_at: number
  ended_at: number | null
  end_reason: SessionEndReason | null
}

/** Every child-facing interaction logs one of these (SPEC §6); a new interaction adds its type here. */
export type EventType =
  | 'session_start'
  | 'session_end'
  | 'request_tap'
  | 'request_tap_model'
  | 'request_tap_debounced'
  | 'request_verbal_attempt'
  | 'pause_open'
  | 'pause_filled'
  | 'pause_timeout'
  | 'pause_parent_credit'
  | 'game_round_end'
  | 'parent_gate_open'
  | 'tab_switch'

/** Timestamps across all tables are Unix epoch milliseconds from Date.now(). */
export interface EventRow {
  id: number
  session_id: number | null
  ts: number
  type: EventType
  card_id: number | null
  sequence_id: number | null
  item_position: number | null
  payload_json: string | null
}

/** Values are JSON-encoded. */
export interface SettingRow {
  key: string
  value: string
}
