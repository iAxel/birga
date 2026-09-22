import { describe, expect, test } from '@jest/globals'
import { tipOfDay } from '@/features/parent/tip-of-day'

describe('tipOfDay', () => {
  test('keeps one tip for the whole calendar day', () => {
    expect(tipOfDay(new Date(2026, 8, 22, 0, 5), 7)).toBe(tipOfDay(new Date(2026, 8, 22, 23, 55), 7))
  })

  test('moves to the next tip each day and starts over after the last', () => {
    const today = tipOfDay(new Date(2026, 8, 22, 12), 7)

    expect(tipOfDay(new Date(2026, 8, 23, 12), 7)).toBe((today + 1) % 7)
    expect(tipOfDay(new Date(2026, 8, 29, 12), 7)).toBe(today)
  })
})
