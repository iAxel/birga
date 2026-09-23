import { describe, expect, test } from '@jest/globals'
import { ageOf, startOfDay } from '@/features/parent/relative-time'

const MINUTE_MS = 60_000

const HOUR_MS = 60 * MINUTE_MS

const DAY_MS = 24 * HOUR_MS

describe('ageOf', () => {
  test('counts in the largest unit that has passed', () => {
    expect(ageOf(1000, 1000 + 30_000)).toEqual({ unit: 'now', count: 0 })
    expect(ageOf(0, 5 * MINUTE_MS)).toEqual({ unit: 'minute', count: 5 })
    expect(ageOf(0, 2 * HOUR_MS + 30 * MINUTE_MS)).toEqual({ unit: 'hour', count: 2 })
    expect(ageOf(0, 3 * DAY_MS)).toEqual({ unit: 'day', count: 3 })
  })

  test('treats a moment in the future as just now', () => {
    expect(ageOf(5000, 1000)).toEqual({ unit: 'now', count: 0 })
  })
})

describe('startOfDay', () => {
  test('goes back to the local midnight of that day', () => {
    const noon = new Date(2026, 8, 23, 12, 30).getTime()
    const midnight = new Date(2026, 8, 23, 0, 0).getTime()

    expect(startOfDay(noon)).toBe(midnight)
    expect(startOfDay(midnight)).toBe(midnight)
  })
})
