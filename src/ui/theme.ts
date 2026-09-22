import { StyleSheet } from 'react-native'

/** One fixed light palette: warm neutral background, near-black text for written words, a single muted accent. */
export const colors = {
  background: '#F5F1EA',
  surface: '#FFFFFF',
  text: '#1C1B19',
  textMuted: '#6E6A63',
  textHint: '#B8B2A7',
  accent: '#4A7C82',
  accentSoft: '#DCE8E6',
  dim: 'rgba(28, 27, 25, 0.5)',
  parentControl: 'rgba(28, 27, 25, 0.14)',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const radii = {
  sm: 8,
  md: 16,
  lg: 24,
}

/** Minimum touch target sizes in points: child mode per CLAUDE.md, parent mode per iOS HIG. */
export const touch = {
  child: 120,
  parent: 44,
}

export const typography = StyleSheet.create({
  cardWord: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '600',
  },
  body: {
    color: colors.text,
    fontSize: 17,
  },
  caption: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
})
