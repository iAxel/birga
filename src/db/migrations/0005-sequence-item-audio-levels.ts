import type { Migration } from '@/db/migrate'

/**
 * The loudness of the parent's recording of a sequence item, as a card already keeps it (migration 3), so the editor
 * draws the shape of the take whenever the item is opened again. Null for items recorded before this version.
 */
export const sequenceItemAudioLevels: Migration = {
  version: 5,
  name: 'sequence-item-audio-levels',
  sql: `
    ALTER TABLE sequence_items ADD COLUMN audio_levels TEXT;
  `,
}
