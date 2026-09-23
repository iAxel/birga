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
  /** Loudness of the recording while it was made; null for a card recorded before the app kept it. */
  audioLevels: number[] | null
}

export function emptyDraft(boardId: number): CardDraft {
  return {
    boardId,
    text: '',
    image: null,
    audio: null,
    audioLevels: null,
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
    audioLevels: card.audioLevels,
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
 * Stores newly captured media, then writes the card. Every file this call stored is removed again if anything after it
 * fails, so a half-saved card leaves nothing behind; after a successful edit, the files the card no longer uses go.
 */
export async function saveCard(cards: CardsRepository, draft: CardDraft, original: Card | null): Promise<void> {
  if (!draft.audio || !isDraftComplete(draft)) {
    throw new Error('CARD_DRAFT_INCOMPLETE')
  }

  const stored: string[] = []

  try {
    const input: CardInput = {
      boardId: draft.boardId,
      text: draft.text,
      imagePath: draft.image ? await persist(draft.image, stored) : null,
      audioPath: await persist(draft.audio, stored),
      audioLevels: draft.audioLevels,
    }

    await writeCard(cards, input, original)

    if (original) {
      removeReplacedFiles(original, input)
    }
  } catch (err) {
    for (const path of stored) {
      deleteMedia(path)
    }

    throw err
  }
}

/** Copies a freshly captured file into the app's media folder and notes it, so a later failure can take it back. */
async function persist(media: MediaDraft, stored: string[]): Promise<string> {
  if (media.kind === 'stored') {
    return media.path
  }

  const path = await storeMedia(media.uri, 'cards')

  stored.push(path)

  return path
}

async function writeCard(cards: CardsRepository, input: CardInput, original: Card | null): Promise<void> {
  if (original) {
    await cards.update(original.id, input)

    return
  }

  await cards.create(input)
}

function removeReplacedFiles(original: Card, input: CardInput): void {
  if (original.imagePath && original.imagePath !== input.imagePath) {
    deleteMedia(original.imagePath)
  }

  if (original.audioPath !== input.audioPath) {
    deleteMedia(original.audioPath)
  }
}
