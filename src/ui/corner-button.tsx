import { type SFSymbol, SymbolView } from 'expo-symbols'
import type { ReactElement } from 'react'
import { Pressable, StyleSheet } from 'react-native'
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
  onPress?: () => void
  onPressIn?: () => void
  onPressOut?: () => void
}

/** A faint control in a bottom corner of a child screen, meant for the parent (DESIGN §2, Parent corners). */
export function CornerButton({
  icon,
  label,
  hint,
  isOn,
  side,
  onPress,
  onPressIn,
  onPressOut,
}: CornerButtonProps): ReactElement {
  const insets = useSafeAreaInsets()
  const metrics = useChildMetrics()

  return (
    <Pressable
      accessibilityHint={hint}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{
        selected: isOn,
      }}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        styles.button,
        {
          width: metrics.corner,
          height: metrics.corner,
          bottom: Math.max(insets.bottom, metrics.cornerMargin),
          [side]: insets[side] + metrics.cornerMargin,
        },
      ]}
    >
      <SymbolView name={icon} size={ICON_SIZE} tintColor={isOn ? color.accent : color.faint} />
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
