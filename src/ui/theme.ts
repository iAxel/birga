import { StyleSheet } from 'react-native'

/** DESIGN.md §1. No other colors in the app. */
export const color = {
  /** Every screen background. */
  ground: '#F4EFE6',
  /** Cards, panels, list groups. */
  card: '#FFFDF9',
  /** Card border 2 pt (child), panel border 1 pt (parent). */
  cardLine: '#E6DFD2',
  /** Photo placeholder, thumbnail background. */
  photoBg: '#E9E2D6',
  /** Primary text. */
  ink: '#201C17',
  /** Secondary text, labels, inactive icons. */
  muted: '#8A8377',
  /** Pause-game hint text, dividers, parent gate dot. */
  hint: '#D9D1C3',
  /** Parent corner icons on child screens. */
  faint: '#D0C8B9',
  /** Secondary buttons in parent mode. */
  panelAlt: '#EFE9DE',
  /** Only the tap feedback ring, parent primary buttons and active icons. */
  accent: '#2E7D6B',
  /** Accent tint: badges, play buttons. */
  accentBg: '#DDEDE8',
  /** Pause-filled glow, at 45% opacity. */
  reward: '#F3D89A',
  /** Sparks, checkmark. */
  rewardInk: '#D99A2B',
  /** Archive text button only. */
  danger: '#A05A4A',
  /** Suzani medallion strokes (DESIGN §2, Ornament). */
  ornament: '#B9B1A2',
  /** Shadow of the enlarged card. */
  shadow: 'rgba(32, 28, 23, 0.18)',
} as const

export const radius = {
  card: 28,
  photo: 20,
  tapCard: 36,
  panel: 20,
  button: 16,
  buttonSm: 14,
  pill: 48,
}

/** A small general scale plus the named distances of DESIGN §1. */
export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  childPad: 48,
  childGap: 24,
  tabBar: 132,
  parentPad: 20,
  parentGap: 12,
}

/** Minimum touch target sizes in points: child mode per CLAUDE.md, parent mode per iOS HIG. */
export const touch = {
  child: 120,
  parent: 44,
}

/** Manrope faces as loaded by useAppFonts; one family per weight, so fontWeight is never set together with them. */
export const font = {
  regular: 'Manrope-Regular',
  medium: 'Manrope-Medium',
  semiBold: 'Manrope-SemiBold',
  bold: 'Manrope-Bold',
  extraBold: 'Manrope-ExtraBold',
}

/** Parent-mode text roles (DESIGN §1). Child-mode sizes depend on the device and live with their screens. */
export const typography = StyleSheet.create({
  title: {
    color: color.ink,
    fontFamily: font.extraBold,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  section: {
    color: color.muted,
    fontFamily: font.bold,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  row: {
    color: color.ink,
    fontFamily: font.semiBold,
    fontSize: 17,
  },
  body: {
    color: color.muted,
    fontFamily: font.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  hint: {
    color: color.muted,
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    color: color.ink,
    fontFamily: font.bold,
    fontSize: 15,
  },
  buttonPrimary: {
    color: color.card,
    fontFamily: font.bold,
    fontSize: 17,
  },
})
