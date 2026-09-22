import type { ReactElement } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { countdownShare, remainingMs } from '@/features/session/session-clock'
import { useSession } from '@/features/session/session-provider'
import { useNow } from '@/features/session/use-now'
import { color } from '@/ui/theme'

const TICK_MS = 1000

const BAR_HEIGHT = 3

/** The last minute of a session as a thin bar along the top edge that shrinks from right to left; no sound (SPEC §4). */
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
          top: insets.top,
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
    left: 0,
    right: 0,
    height: BAR_HEIGHT,
    pointerEvents: 'none',
  },
  bar: {
    height: BAR_HEIGHT,
    backgroundColor: color.hint,
  },
})
