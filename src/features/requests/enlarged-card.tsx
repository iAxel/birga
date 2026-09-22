import type { ReactElement } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import type { Card } from '@/db'
import { enlargement, type Rect, type Size } from '@/features/requests/board-layout'
import { RequestCard } from '@/features/requests/request-card'
import { colors } from '@/ui/theme'

/** Share of the board the enlarged card may take. */
const ENLARGE_FILL = 0.9

interface EnlargedCardProps {
  card: Card
  slot: Rect
  area: Size
  progress: SharedValue<number>
  reduceMotion: boolean
  onPress: () => void
}

/**
 * The played card in the middle of a dimmed board. It is drawn at full size, so photo and word stay sharp, and animated
 * from a shrunken copy over its slot: progress 0 is the slot, 1 the middle. With reduced motion it only fades in place.
 */
export function EnlargedCard({ card, slot, area, progress, reduceMotion, onPress }: EnlargedCardProps): ReactElement {
  const { target, fromSlot } = enlargement(slot, area, ENLARGE_FILL)

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
  }))

  const cardStyle = useAnimatedStyle(() => {
    const shown = progress.get()

    if (reduceMotion) {
      return {
        opacity: shown,
      }
    }

    return {
      transform: [
        {
          translateX: (1 - shown) * fromSlot.translateX,
        },
        {
          translateY: (1 - shown) * fromSlot.translateY,
        },
        {
          scale: fromSlot.scale + shown * (1 - fromSlot.scale),
        },
      ],
    }
  })

  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} />
      <Animated.View
        style={[
          styles.card,
          {
            left: target.x,
            top: target.y,
          },
          cardStyle,
        ]}
      >
        <Pressable accessibilityLabel={card.text} accessibilityRole="button" onPress={onPress}>
          <RequestCard card={card} size={target} />
        </Pressable>
      </Animated.View>
    </>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: colors.dim,
    pointerEvents: 'none',
  },
  card: {
    position: 'absolute',
  },
})
