import type { ReactElement } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { countdownShare, remainingMs } from '@/features/session/session-clock'
import { useSession } from '@/features/session/session-provider'
import { useNow } from '@/features/session/use-now'
import { color, space } from '@/ui/theme'

const TICK_MS = 1000

const BAR_HEIGHT = 4

/** The last minute of a session as a thin bar across the top that shrinks to nothing; no sound (SPEC §4). */
export function SessionCountdown(): ReactElement | null {
  const insets = useSafeAreaInsets()
  const { active } = useSession()
  const now = useNow(TICK_MS)

  if (!active) {
    return null
  }

  const share = countdownShare(remainingMs(active.clock, now))

  if (share === null) {
    return null
  }

  return (
    <View
      style={[
        styles.track,
        {
          top: insets.top + space.xs,
          left: insets.left + space.lg,
          right: insets.right + space.lg,
        },
      ]}
    >
      <View
        style={[
          styles.bar,
          {
            width: `${share * 100}%`,
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    position: 'absolute',
    height: BAR_HEIGHT,
    overflow: 'hidden',
    borderRadius: BAR_HEIGHT / 2,
    pointerEvents: 'none',
  },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: color.accentBg,
  },
})
