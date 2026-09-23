import { describe, expect, test } from '@jest/globals'
import { afterItem, afterPause, isGameOver, nextPausePosition, startRound } from '@/features/pauseGame/pause-round'

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

describe('a round', () => {
  test('says the items up to the pause, waits, then says the rest', () => {
    const items = 4
    let state = startRound(1, 2)

    expect(state).toMatchObject({ index: 0, phase: 'saying' })

    state = afterItem(state, items)

    expect(state).toMatchObject({ index: 1, phase: 'saying' })

    state = afterItem(state, items)

    expect(state).toMatchObject({ index: 2, phase: 'waiting' })

    state = afterPause(state, true)

    expect(state).toMatchObject({ index: 2, phase: 'saying', wasFilled: true })

    state = afterItem(state, items)

    expect(state).toMatchObject({ index: 3, phase: 'saying' })

    state = afterItem(state, items)

    expect(state).toMatchObject({ index: 4, phase: 'finished' })
  })

  test('is over after the fifth round and not before', () => {
    expect(isGameOver({ ...startRound(5, 1), phase: 'finished' })).toBe(true)
    expect(isGameOver({ ...startRound(4, 1), phase: 'finished' })).toBe(false)
    expect(isGameOver(startRound(5, 1))).toBe(false)
  })
})
