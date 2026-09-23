import { type SFSymbol, SymbolView } from 'expo-symbols'
import type { ReactElement } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useChildMetrics } from '@/ui/child-metrics'
import { color } from '@/ui/theme'

const ICON_SIZE = 26

interface CornerButtonProps {
  icon: SFSymbol
  label: string
  hint?: string
  /** Lit while the control is doing its work: recording an attempt, or modelling. */
  isOn: boolean
  side: 'left' | 'right'
  /** A tap, for a control that acts when it is let go. */
  onPress?: () => void
  /**
   * A touch held on the control, for the attempt corner. It reads raw touches instead of a press: a press takes the one
   * touch responder the screen has, and while the parent held the corner the child's taps on the board did nothing.
   */
  onTouchDown?: () => void
  /** The touch held on the control ended; `isCancelled` when the system took it away rather than the parent letting go. */
  onTouchUp?: (isCancelled: boolean) => void
}

/** A faint control in a bottom corner of a child screen, meant for the parent (DESIGN §2, Parent corners). */
export function CornerButton({
  icon,
  label,
  hint,
  isOn,
  side,
  onPress,
  onTouchDown,
  onTouchUp,
}: CornerButtonProps): ReactElement {
  const insets = useSafeAreaInsets()
  const metrics = useChildMetrics()
  const place = {
    width: metrics.corner,
    height: metrics.corner,
    bottom: Math.max(insets.bottom, metrics.cornerMargin),
    [side]: insets[side] + metrics.cornerMargin,
  }
  const symbol = <SymbolView name={icon} size={ICON_SIZE} tintColor={isOn ? color.accent : color.faint} />

  if (onTouchDown) {
    return (
      <View
        accessibilityHint={hint}
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{
          selected: isOn,
        }}
        accessible
        onAccessibilityTap={() => {
          onTouchDown()
          onTouchUp?.(false)
        }}
        onTouchCancel={() => onTouchUp?.(true)}
        onTouchEnd={() => onTouchUp?.(false)}
        onTouchStart={onTouchDown}
        style={[styles.button, place]}
      >
        {symbol}
      </View>
    )
  }

  return (
    <Pressable
      accessibilityHint={hint}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{
        selected: isOn,
      }}
      onPress={onPress}
      style={[styles.button, place]}
    >
      {symbol}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
