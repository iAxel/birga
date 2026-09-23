import { type SFSymbol, SymbolView } from 'expo-symbols'
import type { ReactElement } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { SequenceItem } from '@/db'
import { strings } from '@/i18n'
import { fontForText } from '@/ui/fonts'
import { color, font, radius, space, touch, typography } from '@/ui/theme'

const TILE_SIZE = 48

const ROW_HEIGHT = 72

interface SequenceItemRowProps {
  item: SequenceItem
  canMoveUp: boolean
  canMoveDown: boolean
  /** Line under the row; the last row of a panel has none. */
  hasSeparator: boolean
  onOpen: () => void
  onMove: (offset: -1 | 1) => void
}

interface ArrowButtonProps {
  icon: SFSymbol
  label: string
  disabled: boolean
  onPress: () => void
}

/** One step of the sequence: the character the child sees, the word, and whether it can be said at all. */
export function SequenceItemRow({
  item,
  canMoveUp,
  canMoveDown,
  hasSeparator,
  onOpen,
  onMove,
}: SequenceItemRowProps): ReactElement {
  return (
    <View style={[styles.row, hasSeparator && styles.separator]}>
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.open}>
        <View style={styles.tile}>
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[styles.tileText, fontForText(item.symbol ?? '', font.extraBold)]}
          >
            {item.symbol ?? String(item.position + 1)}
          </Text>
        </View>
        <View style={styles.texts}>
          <Text numberOfLines={1} style={[typography.row, styles.word, fontForText(item.text, font.bold)]}>
            {item.text}
          </Text>
          {!item.audioPath && <Text style={[typography.body, styles.missing]}>{strings.sequences.needAudio}</Text>}
        </View>
      </Pressable>
      <ArrowButton disabled={!canMoveUp} icon="chevron.up" label={strings.cards.moveUp} onPress={() => onMove(-1)} />
      <ArrowButton disabled={!canMoveDown} icon="chevron.down" label={strings.cards.moveDown} onPress={() => onMove(1)} />
    </View>
  )
}

function ArrowButton({ icon, label, disabled, onPress }: ArrowButtonProps): ReactElement {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{
        disabled,
      }}
      disabled={disabled}
      onPress={onPress}
      style={styles.arrow}
    >
      <SymbolView name={icon} size={18} tintColor={disabled ? color.hint : color.muted} weight="semibold" />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    minHeight: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: space.sm,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: color.cardLine,
  },
  open: {
    flex: 1,
    minHeight: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm + space.xs,
    paddingLeft: space.md,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xs,
    borderWidth: 1.5,
    borderColor: color.cardLine,
    borderRadius: radius.buttonSm - 2,
    backgroundColor: color.card,
  },
  tileText: {
    color: color.ink,
    fontSize: 20,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  word: {
    fontSize: 20,
  },
  missing: {
    color: color.danger,
  },
  arrow: {
    width: touch.parent,
    height: touch.parent,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
