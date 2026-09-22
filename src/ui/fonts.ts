import { useFonts } from 'expo-font'
import type { TextStyle } from 'react-native'
import { font } from '@/ui/theme'

/**
 * Letters Manrope has no glyphs for: Uzbek Cyrillic Ғ Қ Ҳ and the Uzbek Latin modifier letters ʻ ʼ. iOS would draw
 * just those letters in the system font, so a word containing one is drawn in the system font as a whole.
 */
const MISSING_IN_MANROPE = /[ҒғҚқҲҳʻʼ]/u

type FontWeight = NonNullable<TextStyle['fontWeight']>

/** Weights of the Manrope faces, for the system font that stands in for them. */
const WEIGHTS: Record<string, FontWeight> = {
  [font.regular]: '400',
  [font.medium]: '500',
  [font.semiBold]: '600',
  [font.bold]: '700',
  [font.extraBold]: '800',
}

/**
 * Loads the Manrope faces. True once they are ready, and also when loading failed: text then falls back to the system
 * font rather than keeping the app behind the splash screen.
 */
export function useAppFonts(): boolean {
  const [isLoaded, error] = useFonts({
    [font.regular]: require('../../assets/fonts/Manrope-Regular.ttf'),
    [font.medium]: require('../../assets/fonts/Manrope-Medium.ttf'),
    [font.semiBold]: require('../../assets/fonts/Manrope-SemiBold.ttf'),
    [font.bold]: require('../../assets/fonts/Manrope-Bold.ttf'),
    [font.extraBold]: require('../../assets/fonts/Manrope-ExtraBold.ttf'),
  })

  return isLoaded || error !== null
}

/** The face for text typed by the parent (card words): the given Manrope face, or the system font of the same weight. */
export function fontForText(text: string, face: string): TextStyle {
  if (!MISSING_IN_MANROPE.test(text)) {
    return {
      fontFamily: face,
    }
  }

  return {
    fontFamily: 'System',
    fontWeight: WEIGHTS[face] ?? '400',
  }
}
