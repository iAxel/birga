import { describe, expect, test } from '@jest/globals'
import type { Attempt } from '@/db'
import { groupByDay, timeOfDay } from '@/features/parent/attempt-days'

function attempt(id: number, ts: number): Attempt {
  return {
    id,
    ts,
    cardText: 'suv',
    audioPath: `media/attempts/${id}.m4a`,
    durationMs: 1200,
  }
}

describe('groupByDay', () => {
  test('keeps the order and starts a group at each new day', () => {
    const today = new Date(2026, 8, 23, 18, 0).getTime()
    const earlierToday = new Date(2026, 8, 23, 9, 30).getTime()
    const yesterday = new Date(2026, 8, 22, 20, 0).getTime()

    expect(groupByDay([attempt(3, today), attempt(2, earlierToday), attempt(1, yesterday)])).toEqual([
      {
        day: new Date(2026, 8, 23).getTime(),
        attempts: [attempt(3, today), attempt(2, earlierToday)],
      },
      {
        day: new Date(2026, 8, 22).getTime(),
        attempts: [attempt(1, yesterday)],
      },
    ])
  })

  test('has nothing to group without attempts', () => {
    expect(groupByDay([])).toEqual([])
  })
})

describe('timeOfDay', () => {
  test('reads as a clock', () => {
    expect(timeOfDay(new Date(2026, 8, 23, 9, 5).getTime())).toBe('9:05')
    expect(timeOfDay(new Date(2026, 8, 23, 18, 42).getTime())).toBe('18:42')
  })
})
