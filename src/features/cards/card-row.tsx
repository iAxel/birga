import { Image } from 'expo-image'
import { type SFSymbol, SymbolView } from 'expo-symbols'
import type { ReactElement } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { type Card, mediaUri } from '@/db'
import { strings } from '@/i18n'
import { color, radius, space, touch, typography } from '@/ui/theme'

const THUMBNAIL_SIZE = 48

interface CardRowProps {
  card: Card
  position: number
  canMoveUp: boolean
  canMoveDown: boolean
  onOpen: () => void
  onMove: (offset: -1 | 1) => void
}

interface ArrowButtonProps {
  icon: SFSymbol
  label: string
  disabled: boolean
  onPress: () => void
}

/** A card in the board list: its place, photo and word. The arrows change the place the child finds it on the board. */
export function CardRow({ card, position, canMoveUp, canMoveDown, onOpen, onMove }: CardRowProps): ReactElement {
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.open}>
        <Text style={[typography.body, styles.position]}>{position}</Text>
        {card.imagePath ? (
          <Image contentFit="cover" source={{ uri: mediaUri(card.imagePath) }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.noPhoto]} />
        )}
        <Text numberOfLines={1} style={[typography.row, styles.word]}>
          {card.text}
        </Text>
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
      disabled={disabled}
      onPress={onPress}
      style={[styles.arrow, disabled && styles.arrowDisabled]}
    >
      <SymbolView name={icon} size={18} tintColor={color.ink} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.button,
    backgroundColor: color.card,
  },
  open: {
    flex: 1,
    minHeight: touch.parent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.sm,
  },
  position: {
    width: space.lg,
    textAlign: 'center',
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: radius.buttonSm,
  },
  noPhoto: {
    backgroundColor: color.ground,
  },
  word: {
    flex: 1,
  },
  arrow: {
    width: touch.parent,
    height: touch.parent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: {
    opacity: 0.25,
  },
})
