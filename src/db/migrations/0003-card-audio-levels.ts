import type { Migration } from '@/db/migrate'

/**
 * The loudness of the parent's recording, sampled while it was recorded, so the card editor can draw its shape later.
 * A JSON array of numbers from 0 to 1, one per tenth of a second; null for cards recorded before this version.
 */
export const cardAudioLevels: Migration = {
  version: 3,
  name: 'card-audio-levels',
  sql: `
    ALTER TABLE cards ADD COLUMN audio_levels TEXT;
  `,
}
