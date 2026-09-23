import { describe, expect, test } from '@jest/globals'
import { type ChildMetrics, tabBarGap } from '@/ui/child-metrics'

const PHONE: ChildMetrics = {
  formFactor: 'phone',
  pad: 20,
  gap: 16,
  top: 50,
  corner: 52,
  cornerMargin: 8,
  tabGap: 24,
}

const TABLET: ChildMetrics = {
  formFactor: 'tablet',
  pad: 48,
  gap: 24,
  top: 24,
  corner: 56,
  cornerMargin: 20,
  tabGap: 48,
}

describe('tabBarGap', () => {
  test("narrows the gap on a 375 pt iPhone, so the tab targets stay clear of the parent's corners", () => {
    expect(tabBarGap(375, 0, PHONE)).toBe(7)
  })

  test('keeps what fits on a wider phone and the full gap where there is room', () => {
    expect(tabBarGap(390, 0, PHONE)).toBe(22)
    expect(tabBarGap(430, 0, PHONE)).toBe(24)
    expect(tabBarGap(820, 0, TABLET)).toBe(48)
  })

  test('leaves the corners their safe-area inset as well', () => {
    expect(tabBarGap(844, 47, PHONE)).toBe(24)
    expect(tabBarGap(430, 20, PHONE)).toBe(22)
  })

  test('never goes below nothing on a screen too narrow for both', () => {
    expect(tabBarGap(360, 0, PHONE)).toBe(0)
  })
})
