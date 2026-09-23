import { describe, expect, test } from '@jest/globals'
import { parseIdParam } from '@/ui/route-params'

describe('parseIdParam', () => {
  test('reads the id of a record', () => {
    expect(parseIdParam('7')).toBe(7)
  })

  test('has no record for anything that is not a positive whole number', () => {
    expect(parseIdParam(undefined)).toBeNull()
    expect(parseIdParam('')).toBeNull()
    expect(parseIdParam('suv')).toBeNull()
    expect(parseIdParam('0')).toBeNull()
    expect(parseIdParam('-3')).toBeNull()
    expect(parseIdParam('1.5')).toBeNull()
  })
})
