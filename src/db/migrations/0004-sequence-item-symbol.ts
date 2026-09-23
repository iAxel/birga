import type { Migration } from '@/db/migrate'

/**
 * A sequence item may show one character above its word (SPEC §3): the digit of a counting sequence, for a child who
 * reads numbers long before he says them. Null for items that carry only a word.
 */
export const sequenceItemSymbol: Migration = {
  version: 4,
  name: 'sequence-item-symbol',
  sql: `
    ALTER TABLE sequence_items ADD COLUMN symbol TEXT;
  `,
}
