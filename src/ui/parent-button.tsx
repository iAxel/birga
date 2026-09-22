import { type SFSymbol, SymbolView } from 'expo-symbols'
import type { ReactElement } from 'react'
import { Pressable, type StyleProp, StyleSheet, Text, type ViewStyle } from 'react-native'
import { color, radius, space, touch, typography } from '@/ui/theme'

const PRIMARY_HEIGHT = 56

const SECONDARY_HEIGHT = 48

const ICON_SIZE = 18

type ParentButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger'

const TEXT_COLORS: Record<ParentButtonVariant, string> = {
  primary: color.card,
  secondary: color.ink,
  outline: color.ink,
  danger: color.danger,
}

interface ParentButtonProps {
  title: string
  onPress: () => void
  /** Primary: the main action of a screen, accent. Secondary: soft fill. Outline: thin line. Danger: text only. */
  variant?: ParentButtonVariant
  icon?: SFSymbol
  disabled?: boolean
  accessibilityLabel?: string
  style?: StyleProp<ViewStyle>
}

/** Parent-mode button (DESIGN §2): stretches to its container unless given a width; at least 44 pt high. */
export function ParentButton({
  title,
  onPress,
  variant = 'outline',
  icon,
  disabled = false,
  accessibilityLabel,
  style,
}: ParentButtonProps): ReactElement {
  const textColor = TEXT_COLORS[variant]

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{
        disabled,
      }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && styles.pressed,
        disabled && (variant === 'primary' ? styles.primaryDisabled : styles.disabled),
        style,
      ]}
    >
      {icon && <SymbolView name={icon} size={ICON_SIZE} tintColor={textColor} />}
      {title.length > 0 && (
        <Text
          style={[
            variant === 'primary' ? typography.buttonPrimary : typography.button,
            {
              color: textColor,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: touch.parent,
    minWidth: touch.parent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
  },
  primary: {
    minHeight: PRIMARY_HEIGHT,
    borderRadius: radius.button,
    backgroundColor: color.accent,
  },
  secondary: {
    minHeight: SECONDARY_HEIGHT,
    borderRadius: radius.buttonSm,
    backgroundColor: color.panelAlt,
  },
  outline: {
    minHeight: SECONDARY_HEIGHT,
    borderWidth: 1.5,
    borderColor: color.hint,
    borderRadius: radius.buttonSm,
  },
  /** A disabled main action turns neutral instead of fading, so it does not read as a pale accent. */
  primaryDisabled: {
    backgroundColor: color.hint,
  },
  danger: {},
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.4,
  },
})
