import { describe, expect, test } from '@jest/globals'
import { medallionStroke, medallionSvg } from '@/ui/medallion'

describe('medallionSvg', () => {
  test('draws rings, 8 petals, 8 leaves and 16 dots in one stroke color, without fills', () => {
    const svg = medallionSvg({
      stroke: '#B9B1A2',
      strokeWidth: 2,
    })

    expect(svg.match(/<path /g)).toHaveLength(16)
    expect(svg.match(/<circle /g)).toHaveLength(4 + 16)
    expect(svg).toContain('fill="none" stroke="#B9B1A2"')
    expect(svg).not.toContain('NaN')
  })

  test('keeps the stroke the same number of points at any size', () => {
    expect(medallionStroke(1.5, 750)).toBe(2)
    expect(medallionStroke(1.5, 300)).toBe(5)
  })
})
