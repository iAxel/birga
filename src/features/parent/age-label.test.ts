import { describe, expect, test } from '@jest/globals'
import { ageLabel } from '@/features/parent/age-label'
import { strings } from '@/i18n'

describe('ageLabel', () => {
  test('says how long ago in the unit that was counted', () => {
    expect(ageLabel({ unit: 'now', count: 0 })).toBe(strings.session.ageNow)
    expect(ageLabel({ unit: 'minute', count: 5 })).toBe(strings.session.ageMinutes(5))
    expect(ageLabel({ unit: 'hour', count: 2 })).toBe(strings.session.ageHours(2))
    expect(ageLabel({ unit: 'day', count: 3 })).toBe(strings.session.ageDays(3))
  })
})
