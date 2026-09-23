import { deleteMedia, type SequenceItem, type SequenceItemInput, type SequencesRepository, storeMedia } from '@/db'
import type { MediaDraft } from '@/features/cards/card-draft'

export interface SequenceItemDraft {
  sequenceId: number
  text: string
  /** One character above the word; empty when the item has none. */
  symbol: string
  image: MediaDraft | null
  audio: MediaDraft | null
  /** Shape of the recording, drawn in the editor; kept with the item, as a card's is. */
  audioLevels: number[] | null
}

export function emptyItemDraft(sequenceId: number): SequenceItemDraft {
  return {
    sequenceId,
    text: '',
    symbol: '',
    image: null,
    audio: null,
    audioLevels: null,
  }
}

export function draftFromItem(item: SequenceItem): SequenceItemDraft {
  return {
    sequenceId: item.sequenceId,
    text: item.text,
    symbol: item.symbol ?? '',
    image: item.imagePath
      ? {
          kind: 'stored',
          path: item.imagePath,
        }
      : null,
    audio: item.audioPath
      ? {
          kind: 'stored',
          path: item.audioPath,
        }
      : null,
    audioLevels: item.audioLevels,
  }
}

/** An item needs a word that is not blank and the parent's voice; the symbol and the image are optional. */
export function isItemDraftComplete(draft: SequenceItemDraft): boolean {
  return draft.text.trim().length > 0 && draft.audio !== null
}

/**
 * Stores newly captured media, then writes the item. Every file this call stored is removed again if storing or
 * writing fails. Once the item is written, the files it no longer uses go, as far as they can: a file that cannot be
 * deleted stays behind rather than take the new ones with it.
 */
export async function saveSequenceItem(
  sequences: SequencesRepository,
  draft: SequenceItemDraft,
  original: SequenceItem | null,
): Promise<void> {
  if (!isItemDraftComplete(draft)) {
    throw new Error('SEQUENCE_ITEM_DRAFT_INCOMPLETE')
  }

  const stored: string[] = []
  let input: SequenceItemInput

  try {
    input = {
      sequenceId: draft.sequenceId,
      text: draft.text,
      symbol: draft.symbol.trim() === '' ? null : draft.symbol.trim(),
      imagePath: draft.image ? await persist(draft.image, stored) : null,
      audioPath: draft.audio ? await persist(draft.audio, stored) : null,
      audioLevels: draft.audioLevels,
    }

    await write(sequences, input, original)
  } catch (err) {
    for (const path of stored) {
      deleteMedia(path)
    }

    throw err
  }

  if (original) {
    removeReplacedFiles(original, input)
  }
}

/** Copies a freshly captured file into the app's media folder and notes it, so a later failure can take it back. */
async function persist(media: MediaDraft, stored: string[]): Promise<string> {
  if (media.kind === 'stored') {
    return media.path
  }

  const path = await storeMedia(media.uri, 'sequences')

  stored.push(path)

  return path
}

async function write(sequences: SequencesRepository, input: SequenceItemInput, original: SequenceItem | null): Promise<void> {
  if (original) {
    await sequences.updateItem(original.id, input)

    return
  }

  await sequences.createItem(input)
}

function removeReplacedFiles(original: SequenceItem, input: SequenceItemInput): void {
  if (original.imagePath && original.imagePath !== input.imagePath) {
    deleteQuietly(original.imagePath)
  }

  if (original.audioPath && original.audioPath !== input.audioPath) {
    deleteQuietly(original.audioPath)
  }
}

function deleteQuietly(path: string): void {
  try {
    deleteMedia(path)
  } catch {
    return
  }
}
