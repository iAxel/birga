import type { Migration } from '@/db/migrate'

/**
 * Data model from SPEC §6. Ids are AUTOINCREMENT so an id the event log points to is never reused, and a partial
 * unique index keeps at most one board active: switch boards by deactivating the old one first.
 */
export const initial: Migration = {
  version: 1,
  name: 'initial',
  sql: `
    CREATE TABLE boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      position INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
      created_at INTEGER NOT NULL
    );

    CREATE UNIQUE INDEX boards_one_active ON boards (is_active) WHERE is_active = 1;

    CREATE TABLE cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL REFERENCES boards (id),
      text TEXT NOT NULL,
      image_path TEXT,
      audio_path TEXT,
      position INTEGER NOT NULL,
      is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
      created_at INTEGER NOT NULL
    );

    CREATE INDEX cards_board_position ON cards (board_id, position);

    CREATE TABLE sequences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      is_active INTEGER NOT NULL CHECK (is_active IN (0, 1)),
      created_at INTEGER NOT NULL
    );

    CREATE TABLE sequence_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sequence_id INTEGER NOT NULL REFERENCES sequences (id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      text TEXT NOT NULL,
      audio_path TEXT,
      image_path TEXT
    );

    CREATE INDEX sequence_items_sequence_position ON sequence_items (sequence_id, position);

    CREATE TABLE sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      end_reason TEXT
    );

    CREATE TABLE events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER REFERENCES sessions (id),
      ts INTEGER NOT NULL,
      type TEXT NOT NULL,
      card_id INTEGER REFERENCES cards (id),
      sequence_id INTEGER REFERENCES sequences (id),
      item_position INTEGER,
      payload_json TEXT
    );

    CREATE INDEX events_session ON events (session_id);

    CREATE INDEX events_ts ON events (ts);

    CREATE TABLE settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `,
}
