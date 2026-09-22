import { Image } from 'expo-image'
import { SymbolView } from 'expo-symbols'
import type { ReactElement } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { type Card, mediaUri } from '@/db'
import type { Size } from '@/features/requests/board-layout'
import { fontForText } from '@/ui/fonts'
import { type FormFactor, useFormFactor } from '@/ui/form-factor'
import { color, font, radius, space } from '@/ui/theme'

/** DESIGN §1–2 at a card's size on the board: word alone, word under a photo, and the strip that holds the latter. */
const LOOK: Record<FormFactor, { word: number; wordUnderPhoto: number; strip: number }> = {
  tablet: {
    word: 104,
    wordUnderPhoto: 52,
    strip: 92,
  },
  phone: {
    word: 88,
    wordUnderPhoto: 44,
    strip: 76,
  },
}

const PHOTO_INSET = 12

/** Six cards on a screen are small: a word alone then takes at most this share of the card height. */
const WORD_MAX_HEIGHT_SHARE = 0.45

/** A word under a photo takes at most this share of its strip. */
const WORD_MAX_STRIP_SHARE = 0.6

/** Tracking as a share of the font size: -2 at 104 pt for a word alone, -0.5 at 52 pt under a photo. */
const TRACKING = {
  word: -2 / 104,
  wordUnderPhoto: -0.5 / 52,
}

const SPEAKER_SHARE = 0.4

interface RequestCardProps {
  card: Card
  size: Size
  /** How much larger than its slot the card is drawn; inset, strip and word grow with it, so the move to the middle is seamless. */
  scale?: number
  /** The played card in the middle of the board: accent border, shadow, and a speaker while the recording plays. */
  isEnlarged?: boolean
  isPlaying?: boolean
}

/** The real photo above and the word in a strip below it; a card without a photo is only the word, larger. */
export function RequestCard({ card, size, scale = 1, isEnlarged = false, isPlaying = false }: RequestCardProps): ReactElement {
  const look = LOOK[useFormFactor()]
  const hasPhoto = card.imagePath !== null
  const baseWordSize = hasPhoto
    ? Math.min(look.wordUnderPhoto, look.strip * WORD_MAX_STRIP_SHARE)
    : Math.min(look.word, (size.height / scale) * WORD_MAX_HEIGHT_SHARE)
  const wordSize = baseWordSize * scale
  const speakerSize = wordSize * SPEAKER_SHARE
  const speakerGap = space.md * scale

  return (
    <View
      style={[
        styles.card,
        {
          width: size.width,
          height: size.height,
        },
        isEnlarged ? styles.enlarged : styles.atRest,
      ]}
    >
      {card.imagePath && (
        <Image
          contentFit="cover"
          source={{
            uri: mediaUri(card.imagePath),
          }}
          style={[
            styles.photo,
            {
              marginTop: PHOTO_INSET * scale,
              marginHorizontal: PHOTO_INSET * scale,
              borderRadius: radius.photo * scale,
            },
          ]}
        />
      )}
      <View
        style={[
          styles.wordRow,
          hasPhoto
            ? {
                height: look.strip * scale,
              }
            : styles.wordAlone,
        ]}
      >
        {isEnlarged && (
          <View
            style={{
              width: speakerSize + speakerGap,
            }}
          />
        )}
        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[
            styles.word,
            fontForText(card.text, hasPhoto ? font.bold : font.extraBold),
            {
              fontSize: wordSize,
              letterSpacing: wordSize * (hasPhoto ? TRACKING.wordUnderPhoto : TRACKING.word),
            },
          ]}
        >
          {card.text}
        </Text>
        {isEnlarged && (
          <SymbolView
            name="speaker.wave.2"
            size={speakerSize}
            style={{
              marginLeft: speakerGap,
              opacity: isPlaying ? 1 : 0,
            }}
            tintColor={color.accent}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.card,
  },
  atRest: {
    borderWidth: 2,
    borderColor: color.cardLine,
    borderRadius: radius.card,
  },
  enlarged: {
    borderWidth: 4,
    borderColor: color.accent,
    borderRadius: radius.tapCard,
    boxShadow: [
      {
        offsetX: 0,
        offsetY: 24,
        blurRadius: 60,
        color: color.shadow,
      },
    ],
  },
  photo: {
    flex: 1,
    backgroundColor: color.photoBg,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  wordAlone: {
    flex: 1,
  },
  word: {
    flexShrink: 1,
    color: color.ink,
    textAlign: 'center',
  },
})
