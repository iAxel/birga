import type { Migration } from '@/db/migrate'
import { initial } from './0001-initial'

/** All migrations in order. Append new versions; never edit, remove or reorder applied ones. */
export const migrations: Migration[] = [initial]
