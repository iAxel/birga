import { describe, expect, test } from '@jest/globals'
import {
  afterItem,
  afterPause,
  isGameOver,
  nextPausePosition,
  type RoundState,
  type SaidItem,
  startRound,
} from '@/features/pauseGame/pause-round'

describe('nextPausePosition', () => {
  test('never pauses before the second item', () => {
    expect(nextPausePosition(5, null, 0)).toBe(1)
    expect(nextPausePosition(5, null, 0.999)).toBe(4)
  })

  test('keeps away from the place it paused last round', () => {
    const places = [0, 0.4, 0.8].map((pick) => nextPausePosition(4, 2, pick))

    expect(places).not.toContain(2)
    expect(places).toEqual([1, 1, 3])
  })

  test('falls back on the only place there is', () => {
    expect(nextPausePosition(2, 1, 0.5)).toBe(1)
  })
})

/** The report that the item the round is on has been said. */
function said(state: RoundState): SaidItem {
  return {
    round: state.round,
    index: state.index,
  }
}

describe('a round', () => {
  test('says the items up to the pause, waits, then says the rest', () => {
    const items = 4
    let state = startRound(1, 2)

    expect(state).toMatchObject({ index: 0, phase: 'saying' })

    state = afterItem(state, said(state), items)

    expect(state).toMatchObject({ index: 1, phase: 'saying' })

    state = afterItem(state, said(state), items)

    expect(state).toMatchObject({ index: 2, phase: 'waiting' })

    state = afterPause(state, true)

    expect(state).toMatchObject({ index: 2, phase: 'saying', wasFilled: true })

    state = afterItem(state, said(state), items)

    expect(state).toMatchObject({ index: 3, phase: 'saying' })

    state = afterItem(state, said(state), items)

    expect(state).toMatchObject({ index: 4, phase: 'finished' })
  })

  test('ignores a late report about an item the round has already left', () => {
    const items = 4
    const first = startRound(1, 2)
    const second = afterItem(first, said(first), items)
    const waiting = afterItem(second, said(second), items)

    expect(afterItem(second, said(first), items)).toBe(second)
    expect(afterItem(waiting, said(second), items)).toBe(waiting)
    expect(afterItem(waiting, { round: 2, index: 2 }, items)).toBe(waiting)
  })

  test('ends a pause only while it is waiting', () => {
    const waiting = afterItem(startRound(1, 1), { round: 1, index: 0 }, 3)
    const ended = afterPause(waiting, false)

    expect(afterPause(ended, true)).toBe(ended)
    expect(ended.wasFilled).toBe(false)
  })

  test('is over after the fifth round and not before', () => {
    expect(isGameOver({ ...startRound(5, 1), phase: 'finished' }, 5)).toBe(true)
    expect(isGameOver({ ...startRound(4, 1), phase: 'finished' }, 5)).toBe(false)
    expect(isGameOver(startRound(5, 1), 5)).toBe(false)
    expect(isGameOver({ ...startRound(3, 1), phase: 'finished' }, 3)).toBe(true)
    expect(isGameOver({ ...startRound(5, 1), phase: 'finished' }, 8)).toBe(false)
  })
})
