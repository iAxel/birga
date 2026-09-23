import { useRouter } from 'expo-router'
import type { ReactElement } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Circle } from 'react-native-svg'
import { useSession } from '@/features/session/session-provider'
import { useEventLog } from '@/features/session/use-event-log'
import { strings } from '@/i18n'
import { GATE_INSET } from '@/ui/child-metrics'
import { color, touch } from '@/ui/theme'

const HOLD_MS = 3000

const DOT_SIZE = 12

const RING_SIZE = 26

const RING_STROKE = 2

const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2

const RING_LENGTH = 2 * Math.PI * RING_RADIUS

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

/**
 * Hidden way into parent mode: a small dim dot in the top-left corner that reacts only to a 3-second hold. While it is
 * held, a thin accent ring around the dot fills clockwise; letting go resets it. Opening parent mode is logged and
 * pauses the running session until the parent returns.
 *
 * The mockups put it on the right, where the medallion of the start and goodbye screens is: the dot was hard to make
 * out against it, so it sits on the left, where nothing is drawn.
 */
export function ParentGate(): ReactElement {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const session = useSession()
  const logEvent = useEventLog()
  const held = useSharedValue(0)

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_LENGTH * (1 - held.get()),
  }))

  function startHold(): void {
    held.set(
      withTiming(1, {
        duration: HOLD_MS,
        easing: Easing.linear,
      }),
    )
  }

  function releaseHold(): void {
    held.set(0)
  }

  function openParentMode(now: number): void {
    logEvent({
      type: 'parent_gate_open',
    })

    session.pause(now)

    router.push('/parent')
  }

  return (
    <Pressable
      accessibilityLabel={strings.parentGate.label}
      delayLongPress={HOLD_MS}
      onLongPress={() => openParentMode(Date.now())}
      onPressIn={startHold}
      onPressOut={releaseHold}
      style={[
        styles.gate,
        {
          top: insets.top + GATE_INSET,
          left: insets.left + GATE_INSET,
        },
      ]}
    >
      <Svg height={RING_SIZE} style={styles.ring} width={RING_SIZE}>
        <AnimatedCircle
          animatedProps={ringProps}
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          fill="none"
          r={RING_RADIUS}
          rotation={-90}
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          stroke={color.accent}
          strokeDasharray={`${RING_LENGTH} ${RING_LENGTH}`}
          strokeWidth={RING_STROKE}
        />
      </Svg>
      <View style={styles.dot} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  gate: {
    position: 'absolute',
    width: touch.parent,
    height: touch.parent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: color.hint,
  },
})
