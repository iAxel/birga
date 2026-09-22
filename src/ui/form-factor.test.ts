import { describe, expect, test } from '@jest/globals'
import { formFactorOf } from '@/ui/form-factor'

describe('formFactorOf', () => {
  test('tells an iPad from an iPhone in either orientation', () => {
    expect(formFactorOf(1180, 820)).toBe('tablet')
    expect(formFactorOf(820, 1180)).toBe('tablet')
    expect(formFactorOf(390, 844)).toBe('phone')
    expect(formFactorOf(932, 430)).toBe('phone')
  })

  test('treats an iPad in narrow split view as a phone', () => {
    expect(formFactorOf(320, 1024)).toBe('phone')
  })
})
