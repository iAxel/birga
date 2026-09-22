import type { ReactElement } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { colors, radii, spacing, touch, typography } from '@/ui/theme'

interface ParentButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'plain'
  disabled?: boolean
}

/** Parent-mode button: full width, at least 44 pt high, one accent colour for the main action of a screen. */
export function ParentButton({ title, onPress, variant = 'plain', disabled = false }: ParentButtonProps): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled,
      }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.primary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[typography.body, variant === 'primary' && styles.primaryText]}>{title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: touch.parent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  primary: {
    backgroundColor: colors.accentSoft,
  },
  primaryText: {
    color: colors.accent,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.4,
  },
})
