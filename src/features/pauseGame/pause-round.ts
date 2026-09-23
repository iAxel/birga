/** A round needs this many items with the parent's voice: one to say, one to pause before, one to carry on with. */
export const MIN_SEQUENCE_ITEMS = 3

/** What the round is doing: saying the items, waiting for the child, or done. */
export type RoundPhase = 'saying' | 'waiting' | 'finished'

export interface RoundState {
  /** 1 to the rounds the game gives. */
  round: number
  /** The item the child is meant to fill in. */
  pauseAt: number
  /** The item the app is at. */
  index: number
  phase: RoundPhase
  /** Whether the pause of this round was filled, which decides the reward. */
  wasFilled: boolean
}

/**
 * Where the pause falls this round: never before the second item, so the child always hears the sequence start, and
 * not where it fell last round, so the game does not become a place to learn one gap by heart.
 */
export function nextPausePosition(itemCount: number, previous: number | null, pick: number): number {
  const options: number[] = []

  for (let index = 1; index < itemCount; index++) {
    if (index !== previous) {
      options.push(index)
    }
  }

  const choices = options.length > 0 ? options : [1]
  const chosen = Math.floor(Math.min(0.999_999, Math.max(0, pick)) * choices.length)

  return choices[chosen]
}

export function startRound(round: number, pauseAt: number): RoundState {
  return {
    round,
    pauseAt,
    index: 0,
    phase: 'saying',
    wasFilled: false,
  }
}

/** The app finished saying an item: the next one follows, unless the pause or the end of the sequence comes first. */
export function afterItem(state: RoundState, itemCount: number): RoundState {
  const index = state.index + 1

  if (index >= itemCount) {
    return {
      ...state,
      index,
      phase: 'finished',
    }
  }

  return {
    ...state,
    index,
    phase: index === state.pauseAt ? 'waiting' : 'saying',
  }
}

/** The pause ended, filled by the child or run out: either way the app says the item and carries on. */
export function afterPause(state: RoundState, wasFilled: boolean): RoundState {
  return {
    ...state,
    phase: 'saying',
    wasFilled,
  }
}

/** After the last round the game is over, and the tab does nothing until the next session (SPEC §3). */
export function isGameOver(state: RoundState, roundsPerGame: number): boolean {
  return state.phase === 'finished' && state.round >= roundsPerGame
}
