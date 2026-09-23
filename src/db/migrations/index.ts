import type { Migration } from '@/db/migrate'
import { initial } from './0001-initial'
import { cardAudioRequired } from './0002-card-audio-required'
import { cardAudioLevels } from './0003-card-audio-levels'
import { sequenceItemSymbol } from './0004-sequence-item-symbol'

/** All migrations in order. Append new versions; never edit, remove or reorder applied ones. */
export const migrations: Migration[] = [initial, cardAudioRequired, cardAudioLevels, sequenceItemSymbol]
