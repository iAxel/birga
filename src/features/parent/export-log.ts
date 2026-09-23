import { Directory, File, Paths } from 'expo-file-system'
import { shareAsync } from 'expo-sharing'
import JSZip from 'jszip'
import type { Repositories, SequenceItem } from '@/db'
import { eventsCsv, EXPORT_PREFIX, exportFileName } from '@/features/parent/export-file'

/** Enough to carry every attempt a family can record; the log keeps no more than this either. */
const ATTEMPT_LIMIT = 10_000

/**
 * Everything the log holds as one archive the parent can send on (SPEC §5): the events as a spreadsheet, the sessions,
 * the settings and the cards they point at as JSON, and the recorded attempts as the files they are. This is the only
 * way anything leaves the device.
 */
export async function exportLog(repositories: Repositories, now: number): Promise<void> {
  const [events, sessions, settings, cards, boards, sequences, attempts] = await Promise.all([
    repositories.events.listAll(),
    repositories.sessions.listAll(),
    repositories.settings.load(),
    repositories.cards.listAll(),
    repositories.boards.list(),
    repositories.sequences.list(),
    repositories.events.listAttempts(ATTEMPT_LIMIT),
  ])

  const items: SequenceItem[] = []

  for (const sequence of sequences) {
    items.push(...(await repositories.sequences.listItems(sequence.id)))
  }

  const zip = new JSZip()

  zip.file('events.csv', eventsCsv(events))
  zip.file('sessions.json', JSON.stringify(sessions, null, 2))
  zip.file('settings.json', JSON.stringify(settings, null, 2))
  zip.file('cards.json', JSON.stringify({ boards, cards }, null, 2))

  /** The pause events name a sequence and a position, and mean nothing without the words behind them. */
  zip.file('sequences.json', JSON.stringify({ sequences, items }, null, 2))

  for (const attempt of attempts) {
    const file = new File(Paths.document, attempt.audioPath)

    if (file.exists) {
      zip.file(`attempts/${fileNameOf(attempt.audioPath)}`, await file.bytes())
    }
  }

  const archive = await zip.generateAsync({
    type: 'uint8array',
  })

  deleteExports()

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

/**
 * Deletes the archives of earlier exports, which hold the child's recorded attempts. The one being shared has to stay
 * until the share sheet is done with it, so an export clears them on the way in rather than on the way out; clearing
 * the diary clears them too.
 */
export function deleteExports(): void {
  try {
    for (const entry of new Directory(Paths.cache).list()) {
      if (entry instanceof File && entry.name.startsWith(EXPORT_PREFIX) && entry.name.endsWith('.zip')) {
        entry.delete()
      }
    }
  } catch {
    return
  }
}
