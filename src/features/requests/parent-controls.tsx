import { type SFSymbol, SymbolView } from 'expo-symbols'
import { type ReactElement, useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { strings } from '@/i18n'
import { colors, spacing, touch } from '@/ui/theme'

/** How long the attempt button stays lit, so the parent sees the tap counted. */
const ATTEMPT_NOTED_MS = 800

const ICON_SIZE = 20

interface ParentControlsProps {
  isModeling: boolean
  onAttempt: () => void
  onToggleModeling: () => void
}

interface CornerButtonProps {
  icon: SFSymbol
  label: string
  isOn: boolean
  onPress: () => void
}

/**
 * Two small, dim controls in the bottom corners, meant for the parent (SPEC §2): credit a spoken attempt of the child,
 * and switch on modelling, which marks the next taps as the parent's own.
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
    <View style={styles.strip}>
      <CornerButton icon="mouth.fill" isOn={isAttemptNoted} label={strings.requests.attempt} onPress={noteAttempt} />
      <CornerButton icon="hand.tap.fill" isOn={isModeling} label={strings.requests.modeling} onPress={onToggleModeling} />
    </View>
  )
}

function CornerButton({ icon, label, isOn, onPress }: CornerButtonProps): ReactElement {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{
        selected: isOn,
      }}
      onPress={onPress}
      style={[styles.button, isOn && styles.buttonOn]}
    >
      <SymbolView name={icon} size={ICON_SIZE} tintColor={isOn ? colors.accent : colors.textHint} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  button: {
    width: touch.parent,
    height: touch.parent,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: touch.parent / 2,
  },
  buttonOn: {
    backgroundColor: colors.accentSoft,
  },
})
