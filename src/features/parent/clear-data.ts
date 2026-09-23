import { discardStrayTakes } from '@/audio/takes'
import { deleteAllMedia, deleteMediaFolder, type Repositories } from '@/db'
import { deleteExports } from '@/features/parent/export-log'

/**
 * Throws away the diary: every session, every event, the attempt recordings those events point at, the archives of
 * earlier exports that carry copies of them, and every take still in the recorder's cache. What the parent built
 * stays — cards, sequences, settings. Nothing here is undoable, so the caller asks first, and the export is the only
 * way to keep any of it (SPEC §5). Afterwards no audio of the child is left on the device.
 */
export async function clearLog(repositories: Repositories): Promise<void> {
  await repositories.maintenance.clearLog()

  deleteMediaFolder('attempts')
  deleteExports()
  discardStrayTakes()
}

/**
 * Back to a fresh install: every card, board, sequence, setting and file, and the diary with them. The schema stays
 * applied, so the app comes up on its onboarding rather than migrating anything. Only a development build offers this.
 */
export async function clearEverything(repositories: Repositories): Promise<void> {
  await repositories.maintenance.clearAll()

  deleteAllMedia()
}
