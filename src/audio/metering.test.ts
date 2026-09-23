import { describe, expect, test } from '@jest/globals'
import { flatLevels, levelOrMinimum, meteringLevel } from '@/audio/metering'

describe('meteringLevel', () => {
  test('maps the microphone range onto 0 to 1', () => {
    expect(meteringLevel(0)).toBe(1)
    expect(meteringLevel(-25)).toBe(0.5)
    expect(meteringLevel(-50)).toBe(0)
  })

  test('clamps readings outside the range and survives a missing one', () => {
    expect(meteringLevel(-160)).toBe(0)
    expect(meteringLevel(10)).toBe(1)
    expect(meteringLevel(Number.NaN)).toBe(0)
  })
})

describe('levelOrMinimum', () => {
  test('keeps a silent moment of a recording visible', () => {
    expect(levelOrMinimum(0)).toBeGreaterThan(0)
    expect(levelOrMinimum(0.8)).toBe(0.8)
  })
})

describe('flatLevels', () => {
  test('gives one flat bar per tenth of a second of a recording of unknown shape', () => {
    expect(flatLevels(1.2)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(flatLevels(0)).toEqual([])
  })
})
