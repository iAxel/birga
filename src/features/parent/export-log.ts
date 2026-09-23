import { File, Paths } from 'expo-file-system'
import { shareAsync } from 'expo-sharing'
import JSZip from 'jszip'
import type { Repositories } from '@/db'
import { eventsCsv, exportFileName } from '@/features/parent/export-file'

/** Enough to carry every attempt a family can record; the log keeps no more than this either. */
const ATTEMPT_LIMIT = 10_000

/**
 * Everything the log holds as one archive the parent can send on (SPEC §5): the events as a spreadsheet, the sessions,
 * the settings and the cards they point at as JSON, and the recorded attempts as the files they are. This is the only
 * way anything leaves the device.
 */
export async function exportLog(repositories: Repositories, now: number): Promise<void> {
  const [events, sessions, settings, cards, boards, attempts] = await Promise.all([
    repositories.events.listAll(),
    repositories.sessions.listAll(),
    repositories.settings.load(),
    repositories.cards.listAll(),
    repositories.boards.list(),
    repositories.events.listAttempts(ATTEMPT_LIMIT),
  ])

  const zip = new JSZip()

  zip.file('events.csv', eventsCsv(events))
  zip.file('sessions.json', JSON.stringify(sessions, null, 2))
  zip.file('settings.json', JSON.stringify(settings, null, 2))
  zip.file('cards.json', JSON.stringify({ boards, cards }, null, 2))

  for (const attempt of attempts) {
    const file = new File(Paths.document, attempt.audioPath)

    if (file.exists) {
      zip.file(`attempts/${fileNameOf(attempt.audioPath)}`, await file.bytes())
    }
  }

  const archive = await zip.generateAsync({
    type: 'uint8array',
  })
  const target = new File(Paths.cache, exportFileName(now))

  target.create({
    overwrite: true,
  })
  target.write(archive)

  await shareAsync(target.uri, {
    mimeType: 'application/zip',
    UTI: 'public.zip-archive',
  })
}

function fileNameOf(path: string): string {
  return path.split('/').at(-1) ?? path
}
