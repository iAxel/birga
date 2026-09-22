import { Image } from 'expo-image'
import { type SFSymbol, SymbolView } from 'expo-symbols'
import type { ReactElement } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { type Card, mediaUri } from '@/db'
import { strings } from '@/i18n'
import { fontForText } from '@/ui/fonts'
import { color, font, radius, space, touch, typography } from '@/ui/theme'

const THUMBNAIL_SIZE = 48

const ROW_HEIGHT = 72

interface CardRowProps {
  card: Card
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

/**
 * A card in the board list: its photo, or its word on a small tile, and the word. The arrows change the place the child
 * finds it on the board.
 */
export function CardRow({ card, canMoveUp, canMoveDown, hasSeparator, onOpen, onMove }: CardRowProps): ReactElement {
  return (
    <View style={[styles.row, hasSeparator && styles.separator]}>
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.open}>
        {card.imagePath ? (
          <Image
            contentFit="cover"
            source={{
              uri: mediaUri(card.imagePath),
            }}
            style={styles.thumbnail}
          />
        ) : (
          <View style={[styles.thumbnail, styles.wordTile]}>
            <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.tileWord, fontForText(card.text, font.extraBold)]}>
              {card.text}
            </Text>
          </View>
        )}
        <View style={styles.texts}>
          <Text numberOfLines={1} style={[typography.row, styles.word, fontForText(card.text, font.bold)]}>
            {card.text}
          </Text>
          {!card.imagePath && <Text style={typography.body}>{strings.cards.noPhoto}</Text>}
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
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: radius.buttonSm - 2,
    backgroundColor: color.photoBg,
  },
  wordTile: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xs,
    borderWidth: 1.5,
    borderColor: color.cardLine,
    backgroundColor: color.card,
  },
  tileWord: {
    color: color.ink,
    fontSize: 15,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  word: {
    fontSize: 20,
  },
  arrow: {
    width: touch.parent,
    height: touch.parent,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
