import { type SFSymbol, SymbolView } from 'expo-symbols'
import { type ReactElement, useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { strings } from '@/i18n'
import { useChildMetrics } from '@/ui/child-metrics'
import { color } from '@/ui/theme'

/** How long the attempt icon stays lit, so the parent sees the tap counted. */
const ATTEMPT_NOTED_MS = 800

const ICON_SIZE = 26

const MODELING_BAR_HEIGHT = 3

interface ParentControlsProps {
  isModeling: boolean
  onAttempt: () => void
  onToggleModeling: () => void
}

interface CornerButtonProps {
  icon: SFSymbol
  label: string
  isOn: boolean
  side: 'left' | 'right'
  onPress: () => void
}

/**
 * Two faint controls in the bottom corners, meant for the parent (SPEC §2): the check credits a spoken attempt of the
 * child, the hand switches on modelling, which marks the next taps as the parent's own. While modelling is on, the hand
 * is accent and a thin accent bar runs along the bottom edge.
 */
export function ParentControls({ isModeling, onAttempt, onToggleModeling }: ParentControlsProps): ReactElement {
  const [isAttemptNoted, setIsAttemptNoted] = useState(false)

  useEffect(() => {
    if (!isAttemptNoted) {
      return
    }

    const timeout = setTimeout(() => setIsAttemptNoted(false), ATTEMPT_NOTED_MS)

    return () => clearTimeout(timeout)
  }, [isAttemptNoted])

  function noteAttempt(): void {
    onAttempt()

    setIsAttemptNoted(true)
  }

  return (
    <>
      {isModeling && <View style={styles.modelingBar} />}
      <CornerButton icon="checkmark" isOn={isAttemptNoted} label={strings.requests.attempt} onPress={noteAttempt} side="left" />
      <CornerButton
        icon="hand.raised"
        isOn={isModeling}
        label={strings.requests.modeling}
        onPress={onToggleModeling}
        side="right"
      />
    </>
  )
}

function CornerButton({ icon, label, isOn, side, onPress }: CornerButtonProps): ReactElement {
  const insets = useSafeAreaInsets()
  const metrics = useChildMetrics()

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{
        selected: isOn,
      }}
      onPress={onPress}
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
  modelingBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: MODELING_BAR_HEIGHT,
    backgroundColor: color.accent,
    pointerEvents: 'none',
  },
})
