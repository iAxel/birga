import { deleteAllMedia, deleteMediaFolder, type Repositories } from '@/db'

/**
 * Throws away the diary: every session, every event, and the attempt recordings those events point at. What the parent
 * built stays — cards, sequences, settings. Nothing here is undoable, so the caller asks first, and the export is the
 * only way to keep any of it (SPEC §5).
 */
export async function clearLog(repositories: Repositories): Promise<void> {
  await repositories.maintenance.clearLog()

  deleteMediaFolder('attempts')
}

/**
 * Back to a fresh install: every card, board, sequence, setting and file, and the diary with them. The schema stays
 * applied, so the app comes up on its onboarding rather than migrating anything. Only a development build offers this.
 */
export async function clearEverything(repositories: Repositories): Promise<void> {
  await repositories.maintenance.clearAll()

  deleteAllMedia()
}
