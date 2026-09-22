import { useRouter } from 'expo-router'
import type { ReactElement } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSession } from '@/features/session/session-provider'
import { useEventLog } from '@/features/session/use-event-log'
import { strings } from '@/i18n'
import { colors, spacing, touch } from '@/ui/theme'

const HOLD_MS = 3000

const DOT_SIZE = 12

/** Height the gate takes below the top safe area; child screens keep that strip free of touchable content. */
export const PARENT_GATE_HEIGHT = spacing.sm + touch.parent

/**
 * Hidden way into parent mode: a small dim dot in the top-right corner that reacts only to a 3-second hold. Opening it
 * is logged and pauses the running session until the parent returns.
 */
export function ParentGate(): ReactElement {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const session = useSession()
  const logEvent = useEventLog()

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
      style={[
        styles.gate,
        {
          top: insets.top + spacing.sm,
          right: insets.right + spacing.sm,
        },
      ]}
    >
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
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.parentControl,
  },
})
