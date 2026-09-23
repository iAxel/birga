import { describe, expect, test } from '@jest/globals'
import { dayLabel } from '@/features/parent/day-label'

const NOW = new Date(2026, 8, 23, 14, 0).getTime()

describe('dayLabel', () => {
  test('marks today and writes the month by name', () => {
    expect(dayLabel(new Date(2026, 8, 23).getTime(), NOW)).toBe('Bugun, 23 sentabr')
    expect(dayLabel(new Date(2026, 8, 22).getTime(), NOW)).toBe('22 sentabr')
    expect(dayLabel(new Date(2026, 0, 1).getTime(), NOW)).toBe('1 yanvar')
  })
})
