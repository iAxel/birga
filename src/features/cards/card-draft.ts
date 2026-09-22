import { deleteMedia, mediaUri, storeMedia } from '@/db/media'
import type { Card, CardInput, CardsRepository } from '@/db/repositories/cards.repository'

/** A photo or a recording in the editor: already stored (relative path) or just captured (temporary file URI). */
export type MediaDraft =
  | {
      kind: 'stored'
      path: string
    }
  | {
      kind: 'captured'
      uri: string
    }

export interface CardDraft {
  boardId: number
  text: string
  image: MediaDraft | null
  audio: MediaDraft | null
}

export function emptyDraft(boardId: number): CardDraft {
  return {
    boardId,
    text: '',
    image: null,
    audio: null,
  }
}

export function draftFromCard(card: Card): CardDraft {
  return {
    boardId: card.boardId,
    text: card.text,
    image: card.imagePath
      ? {
          kind: 'stored',
          path: card.imagePath,
        }
      : null,
    audio: {
      kind: 'stored',
      path: card.audioPath,
    },
  }
}

export function mediaDraftUri(media: MediaDraft): string {
  if (media.kind === 'stored') {
    return mediaUri(media.path)
  }

  return media.uri
}

/** A card needs a word that is not blank and the parent's voice; the photo is optional. */
export function isDraftComplete(draft: CardDraft): boolean {
  return draft.text.trim().length > 0 && draft.audio !== null
}

/**
 * Stores newly captured media, then writes the card. If the write fails, the files it just stored are removed again;
 * after a successful edit, the files the card no longer uses are removed.
 */
export async function saveCard(cards: CardsRepository, draft: CardDraft, original: Card | null): Promise<void> {
  if (!draft.audio || !isDraftComplete(draft)) {
    throw new Error('CARD_DRAFT_INCOMPLETE')
  }

  const input: CardInput = {
    boardId: draft.boardId,
    text: draft.text,
    imagePath: draft.image ? await persist(draft.image) : null,
    audioPath: await persist(draft.audio),
  }

  try {
    await writeCard(cards, input, original)
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

  return storeMedia(media.uri, 'cards')
}

async function writeCard(cards: CardsRepository, input: CardInput, original: Card | null): Promise<void> {
  if (original) {
    await cards.update(original.id, input)

    return
  }

  await cards.create(input)
}

function removeNewFiles(draft: CardDraft, input: CardInput): void {
  if (draft.image?.kind === 'captured' && input.imagePath) {
    deleteMedia(input.imagePath)
  }

  if (draft.audio?.kind === 'captured') {
    deleteMedia(input.audioPath)
  }
}

function removeReplacedFiles(original: Card, input: CardInput): void {
  if (original.imagePath && original.imagePath !== input.imagePath) {
    deleteMedia(original.imagePath)
  }

  if (original.audioPath !== input.audioPath) {
    deleteMedia(original.audioPath)
  }
}
