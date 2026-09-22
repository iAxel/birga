import type { Migration } from '@/db/migrate'

/**
 * Every card needs the parent's voice, the photo stays optional. SQLite cannot add NOT NULL to a column, so the table is
 * rebuilt; its AUTOINCREMENT counter is carried over so card ids are still never reused.
 */
export const cardAudioRequired: Migration = {
  version: 2,
  name: 'card-audio-required',
  sql: `
    CREATE TABLE cards_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL REFERENCES boards (id),
      text TEXT NOT NULL,
      image_path TEXT,
      audio_path TEXT NOT NULL,
      position INTEGER NOT NULL,
      is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
      created_at INTEGER NOT NULL
    );

    INSERT INTO cards_new (id, board_id, text, image_path, audio_path, position, is_archived, created_at)
    SELECT id, board_id, text, image_path, audio_path, position, is_archived, created_at FROM cards;

    DELETE FROM sqlite_sequence WHERE name = 'cards_new';

    INSERT INTO sqlite_sequence (name, seq) SELECT 'cards_new', seq FROM sqlite_sequence WHERE name = 'cards';

    DROP TABLE cards;

    ALTER TABLE cards_new RENAME TO cards;

    CREATE INDEX cards_board_position ON cards (board_id, position);
  `,
}
