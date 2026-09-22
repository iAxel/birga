import { describe, expect, test } from '@jest/globals'
import { breakLeftMs, countdownShare, pauseClock, remainingMs, resumeClock, startClock } from '@/features/session/session-clock'

const MINUTE = 60_000

describe('session clock', () => {
  test('counts the session time down from the start and stops at zero', () => {
    const clock = startClock(0, 10 * MINUTE)

    expect(remainingMs(clock, 0)).toBe(10 * MINUTE)
    expect(remainingMs(clock, 4 * MINUTE)).toBe(6 * MINUTE)
    expect(remainingMs(clock, 11 * MINUTE)).toBe(0)
  })

  test('does not count the time the parent spends in parent mode', () => {
    let clock = startClock(0, 10 * MINUTE)

    clock = pauseClock(clock, 3 * MINUTE)

    expect(remainingMs(clock, 20 * MINUTE)).toBe(7 * MINUTE)

    clock = resumeClock(clock, 20 * MINUTE)

    expect(remainingMs(clock, 21 * MINUTE)).toBe(6 * MINUTE)
  })

  test('ignores a second pause or resume', () => {
    const paused = pauseClock(startClock(0, 10 * MINUTE), MINUTE)
    const resumed = resumeClock(paused, 2 * MINUTE)

    expect(pauseClock(paused, 5 * MINUTE)).toBe(paused)
    expect(resumeClock(resumed, 5 * MINUTE)).toBe(resumed)
  })

  test('shows the countdown bar only in the last minute', () => {
    expect(countdownShare(MINUTE + 1)).toBeNull()
    expect(countdownShare(MINUTE)).toBe(1)
    expect(countdownShare(MINUTE / 2)).toBe(0.5)
    expect(countdownShare(0)).toBe(0)
  })

  test('blocks a new session until the break after the last full session has passed', () => {
    expect(breakLeftMs(null, 30 * MINUTE, 0)).toBe(0)
    expect(breakLeftMs(0, 30 * MINUTE, 10 * MINUTE)).toBe(20 * MINUTE)
    expect(breakLeftMs(0, 30 * MINUTE, 40 * MINUTE)).toBe(0)
    expect(breakLeftMs(0, 0, 0)).toBe(0)
  })
})
