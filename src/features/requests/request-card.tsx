import { Image } from 'expo-image'
import type { ReactElement } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { type Card, mediaUri } from '@/db'
import type { Size } from '@/features/requests/board-layout'
import { colors, radii, spacing } from '@/ui/theme'

const MIN_WORD_SIZE = 24

const MAX_WORD_SIZE = 120

interface RequestCardProps {
  card: Card
  size: Size
}

/** The real photo above and the word below in large, high-contrast letters; a card without a photo is only the word. */
export function RequestCard({ card, size }: RequestCardProps): ReactElement {
  const hasPhoto = card.imagePath !== null
  const heightShare = hasPhoto ? 0.14 : 0.3
  const wordSize = Math.min(MAX_WORD_SIZE, Math.max(MIN_WORD_SIZE, Math.min(size.width * 0.28, size.height * heightShare)))

  return (
    <View
      style={[
        styles.card,
        {
          width: size.width,
          height: size.height,
        },
      ]}
    >
      {card.imagePath && <Image contentFit="cover" source={{ uri: mediaUri(card.imagePath) }} style={styles.photo} />}
      <View style={hasPhoto ? styles.caption : styles.wordOnly}>
        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[
            styles.word,
            {
              fontSize: wordSize,
            },
          ]}
        >
          {card.text}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  photo: {
    flex: 1,
  },
  caption: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  wordOnly: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  word: {
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
})
