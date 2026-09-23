import { type ReactElement, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { type FormFactor, useFormFactor } from '@/ui/form-factor'
import { color } from '@/ui/theme'

/** CLAUDE.md, principle 7: one reward animation of at most 1.5 s. */
const REWARD_MS = 1200

/** CLAUDE.md, principle 7: at most eight sparks, and they rise once. */
const SPARKS = 8

const SPARK_SIZE = 10

/** How far a spark rises, in points; every spark goes a little further than the one before. */
const SPARK_RISE = 80

const SPARK_RISE_STEP = 9

const GLOW: Record<FormFactor, { width: number; height: number }> = {
  tablet: {
    width: 460,
    height: 340,
  },
  phone: {
    width: 300,
    height: 260,
  },
}

interface RewardProps {
  /** The moment the pause was filled; a new one plays the animation again. */
  filledAt: number | null
  hasGlow: boolean
  hasSparks: boolean
}

interface SparkProps {
  index: number
  isStill: boolean
  progress: SharedValue<number>
  width: number
}

/**
 * What a filled pause looks like (SPEC §3, DESIGN §2): a soft glow behind the word and a few sparks rising once, both
 * gone within 1.2 s. Either half can be switched off in the settings, and Reduce Motion keeps the glow but holds the
 * sparks still.
 */
export function Reward({ filledAt, hasGlow, hasSparks }: RewardProps): ReactElement {
  const glow = GLOW[useFormFactor()]
  const isStill = useReducedMotion()
  const progress = useSharedValue(0)

  useEffect(() => {
    if (filledAt === null) {
      return
    }

    progress.set(0)
    progress.set(
      withTiming(1, {
        duration: REWARD_MS,
        easing: Easing.linear,
      }),
    )
  }, [filledAt, progress])

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 0.15, 0.7, 1], [0, 0.45, 0.45, 0]),
  }))

  return (
    <View style={styles.layer}>
      {hasGlow && (
        <Animated.View
          style={[
            styles.glow,
            {
              width: glow.width,
              height: glow.height,
              borderRadius: glow.width / 2,
            },
            glowStyle,
          ]}
        />
      )}
      {hasSparks &&
        Array.from({ length: SPARKS }, (_, index) => (
          <Spark index={index} isStill={isStill} key={index} progress={progress} width={glow.width} />
        ))}
    </View>
  )
}

/** One spark: it starts at the edge of the glow, rises and fades. */
function Spark({ index, isStill, progress, width }: SparkProps): ReactElement {
  const offsetX = ((index + 0.5) / SPARKS - 0.5) * width
  const rise = SPARK_RISE + index * SPARK_RISE_STEP

  const style = useAnimatedStyle(() => {
    const shown = progress.get()

    return {
      opacity: interpolate(shown, [0, 0.2, 0.7, 1], [0, 1, 1, 0]),
      transform: [
        {
          translateX: offsetX,
        },
        {
          translateY: isStill ? 0 : interpolate(shown, [0, 1], [0, -rise]),
        },
      ],
    }
  })

  return <Animated.View style={[styles.spark, style]} />
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  glow: {
    position: 'absolute',
    backgroundColor: color.reward,
  },
  spark: {
    position: 'absolute',
    width: SPARK_SIZE,
    height: SPARK_SIZE,
    borderRadius: SPARK_SIZE / 2,
    backgroundColor: color.rewardInk,
  },
})
