import { useRouter } from 'expo-router'
import type { ReactElement } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { strings } from '@/i18n'
import { colors, spacing, touch } from '@/ui/theme'

const HOLD_MS = 3000

const DOT_SIZE = 12

/** Hidden way into parent mode: a small dim dot in the top-right corner that reacts only to a 3-second hold. */
export function ParentGate(): ReactElement {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  function openParentMode(): void {
    router.push('/parent')
  }

  return (
    <Pressable
      accessibilityLabel={strings.parentGate.label}
      delayLongPress={HOLD_MS}
      onLongPress={openParentMode}
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
