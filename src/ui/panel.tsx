import { type SFSymbol, SymbolView } from 'expo-symbols'
import type { PropsWithChildren, ReactElement, ReactNode } from 'react'
import { Pressable, type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { color, radius, space, typography } from '@/ui/theme'

const ROW_HEIGHT = 58

interface PanelProps extends PropsWithChildren {
  /** Rows run edge to edge with their own padding; other content gets the panel's padding. */
  hasRows?: boolean
  style?: StyleProp<ViewStyle>
}

/** A group on the card colour with a thin line (DESIGN §2, Parent mode). */
export function Panel({ hasRows = false, style, children }: PanelProps): ReactElement {
  return <View style={[styles.panel, !hasRows && styles.padded, style]}>{children}</View>
}

interface SectionLabelProps {
  title: string
  /** Muted note at the right end, e.g. "ixtiyoriy". */
  note?: ReactNode
}

/** Uppercase label above or at the top of a panel. */
export function SectionLabel({ title, note }: SectionLabelProps): ReactElement {
  return (
    <View style={styles.label}>
      <Text style={typography.section}>{title}</Text>
      {note}
    </View>
  )
}

interface ListRowProps {
  title: string
  icon?: SFSymbol
  /** Muted text before the chevron. */
  value?: string
  /** Line under the row; the last row of a panel has none. */
  hasSeparator?: boolean
  /** A row that opens a screen ends in a chevron; one that acts on the spot does not. */
  hasChevron?: boolean
  onPress: () => void
}

/** A tappable row of a panel: icon, title, value and a chevron. */
export function ListRow({ title, icon, value, hasSeparator = false, hasChevron = true, onPress }: ListRowProps): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, hasSeparator && styles.separator, pressed && styles.pressed]}
    >
      {icon && <SymbolView name={icon} size={24} tintColor={color.accent} />}
      <Text numberOfLines={1} style={[typography.row, styles.rowTitle]}>
        {title}
      </Text>
      {value !== undefined && (
        <Text numberOfLines={1} style={styles.value}>
          {value}
        </Text>
      )}
      {hasChevron && <SymbolView name="chevron.right" size={15} tintColor={color.hint} weight="semibold" />}
    </Pressable>
  )
}

interface BadgeProps {
  title: string
}

/** Small accent pill, e.g. FAOL on the active board. */
export function Badge({ title }: BadgeProps): ReactElement {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{title}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderColor: color.cardLine,
    borderRadius: radius.panel,
    backgroundColor: color.card,
  },
  padded: {
    gap: space.parentGap,
    padding: space.parentPad,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  row: {
    minHeight: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.parentPad,
    paddingVertical: space.sm,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: color.cardLine,
  },
  pressed: {
    backgroundColor: color.panelAlt,
  },
  rowTitle: {
    flex: 1,
  },
  value: {
    ...typography.row,
    flexShrink: 1,
    color: color.muted,
    fontFamily: typography.body.fontFamily,
  },
  badge: {
    justifyContent: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    borderRadius: radius.buttonSm,
    backgroundColor: color.accentBg,
  },
  badgeText: {
    ...typography.section,
    color: color.accent,
  },
})
