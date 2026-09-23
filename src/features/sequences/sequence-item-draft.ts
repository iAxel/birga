import { deleteMedia, type SequenceItem, type SequenceItemInput, type SequencesRepository, storeMedia } from '@/db'
import type { MediaDraft } from '@/features/cards/card-draft'

export interface SequenceItemDraft {
  sequenceId: number
  text: string
  /** One character above the word; empty when the item has none. */
  symbol: string
  image: MediaDraft | null
  audio: MediaDraft | null
}

export function emptyItemDraft(sequenceId: number): SequenceItemDraft {
  return {
    sequenceId,
    text: '',
    symbol: '',
    image: null,
    audio: null,
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
  }
}

/** An item needs a word that is not blank and the parent's voice; the symbol and the image are optional. */
export function isItemDraftComplete(draft: SequenceItemDraft): boolean {
  return draft.text.trim().length > 0 && draft.audio !== null
}

/**
 * Stores newly captured media, then writes the item. If the write fails, the files it just stored are removed again;
 * after a successful edit, the files the item no longer uses are removed.
 */
export async function saveSequenceItem(
  sequences: SequencesRepository,
  draft: SequenceItemDraft,
  original: SequenceItem | null,
): Promise<void> {
  if (!isItemDraftComplete(draft)) {
    throw new Error('SEQUENCE_ITEM_DRAFT_INCOMPLETE')
  }

  const input: SequenceItemInput = {
    sequenceId: draft.sequenceId,
    text: draft.text,
    symbol: draft.symbol.trim() === '' ? null : draft.symbol.trim(),
    imagePath: draft.image ? await persist(draft.image) : null,
    audioPath: draft.audio ? await persist(draft.audio) : null,
  }

  try {
    await write(sequences, input, original)
  } catch (err) {
    removeNewFiles(draft, input)

    throw err
  }

  if (original) {
    removeReplacedFiles(original, input)
  }
}

async function persist(media: MediaDraft): Promise<string> {
  if (media.kind === 'stored') {
    return media.path
  }

  return storeMedia(media.uri, 'sequences')
}

async function write(sequences: SequencesRepository, input: SequenceItemInput, original: SequenceItem | null): Promise<void> {
  if (original) {
    await sequences.updateItem(original.id, input)

    return
  }

  await sequences.createItem(input)
}

function removeNewFiles(draft: SequenceItemDraft, input: SequenceItemInput): void {
  if (draft.image?.kind === 'captured' && input.imagePath) {
    deleteMedia(input.imagePath)
  }

  if (draft.audio?.kind === 'captured' && input.audioPath) {
    deleteMedia(input.audioPath)
  }
}

function removeReplacedFiles(original: SequenceItem, input: SequenceItemInput): void {
  if (original.imagePath && original.imagePath !== input.imagePath) {
    deleteMedia(original.imagePath)
  }

  if (original.audioPath && original.audioPath !== input.audioPath) {
    deleteMedia(original.audioPath)
  }
}
