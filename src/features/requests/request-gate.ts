import type { EventInput } from '@/db'

/** SPEC §2: a tapped card stays enlarged about 3 s, longer if its recording is longer. */
export const ENLARGED_MS = 3000

/** SPEC §2: modelling switches itself off after 60 s. */
export const MODELING_MS = 60_000

export type IgnoredTapReason = 'busy' | 'repeat'

export interface TapContext {
  cardId: number
  now: number
  /** A card is enlarged or its recording is playing: until it returns, the board belongs to that request. */
  isBoardBusy: boolean
  /** The parent is tapping to model language: logged apart from the child's taps and never held back by the debounce. */
  isModeling: boolean
  /** When a tap of the child last played this card. */
  lastPlayedAt: number | undefined
  debounceMs: number
}

export interface TapDecision {
  play: boolean
  event: EventInput | null
}

/**
 * Decides what a tap on a card does (SPEC §2). The same card is inert for the debounce time after the child played it,
 * and every card is inert while another request is on screen. Ignored taps of the child are logged, so a card he loops
 * on shows up in the log; ignored taps of the parent are not.
 */
export function decideTap(context: TapContext): TapDecision {
  if (context.isBoardBusy) {
    return ignoreTap(context, 'busy')
  }

  if (context.isModeling) {
    return {
      play: true,
      event: {
        type: 'request_tap_model',
        cardId: context.cardId,
      },
    }
  }

  if (context.lastPlayedAt !== undefined && context.now - context.lastPlayedAt < context.debounceMs) {
    return ignoreTap(context, 'repeat')
  }

  return {
    play: true,
    event: {
      type: 'request_tap',
      cardId: context.cardId,
    },
  }
}

function ignoreTap(context: TapContext, reason: IgnoredTapReason): TapDecision {
  if (context.isModeling) {
    return {
      play: false,
      event: null,
    }
  }

  return {
    play: false,
    event: {
      type: 'request_tap_debounced',
      cardId: context.cardId,
      payload: {
        reason,
      },
    },
  }
}
