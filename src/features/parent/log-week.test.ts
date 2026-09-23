import { describe, expect, test } from '@jest/globals'
import { activityLevel, startOfWeek, weekDays } from '@/features/parent/log-week'

const WEDNESDAY = new Date(2026, 8, 23, 14, 0).getTime()

const MONDAY = new Date(2026, 8, 21).getTime()

describe('startOfWeek', () => {
  test('goes back to Monday, and stays on it when it is Monday', () => {
    expect(startOfWeek(WEDNESDAY)).toBe(MONDAY)
    expect(startOfWeek(new Date(2026, 8, 21, 23, 59).getTime())).toBe(MONDAY)
  })

  test('counts Sunday as the end of its week, not the start of the next', () => {
    expect(startOfWeek(new Date(2026, 8, 27, 12, 0).getTime())).toBe(MONDAY)
  })
})

describe('weekDays', () => {
  test('spreads the events over the seven days and marks today', () => {
    const days = weekDays(WEDNESDAY, [
      new Date(2026, 8, 21, 9, 0).getTime(),
      new Date(2026, 8, 23, 10, 0).getTime(),
      new Date(2026, 8, 23, 11, 0).getTime(),
    ])

    expect(days).toHaveLength(7)
    expect(days[0]).toEqual({ day: MONDAY, count: 1, isToday: false, isAhead: false })
    expect(days[2]).toEqual({ day: new Date(2026, 8, 23).getTime(), count: 2, isToday: true, isAhead: false })
    expect(days[3]).toMatchObject({ count: 0, isAhead: true })
  })
})

describe('activityLevel', () => {
  test('gives the four steps of the strip', () => {
    expect(activityLevel(0)).toBe(0)
    expect(activityLevel(4)).toBe(1)
    expect(activityLevel(14)).toBe(2)
    expect(activityLevel(15)).toBe(3)
  })
})
