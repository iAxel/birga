import { describe, expect, test } from '@jest/globals'
import { fontForText } from '@/ui/fonts'
import { font } from '@/ui/theme'

describe('fontForText', () => {
  test('keeps Manrope for Latin and Russian-alphabet Uzbek words', () => {
    expect(fontForText("o'yinchoq", font.bold)).toEqual({
      fontFamily: font.bold,
    })
    expect(fontForText('Ўйин', font.bold)).toEqual({
      fontFamily: font.bold,
    })
  })

  test('draws a word with letters Manrope lacks in the system font of the same weight', () => {
    for (const word of ['қўл', 'ҒИШТ', 'ҳа', 'oʻyin', 'gʻisht', 'maʼno']) {
      expect(fontForText(word, font.extraBold)).toEqual({
        fontFamily: 'System',
        fontWeight: '800',
      })
    }
  })
})
