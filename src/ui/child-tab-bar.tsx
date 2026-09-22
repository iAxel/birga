import type { BottomTabBarProps } from 'expo-router/js-tabs'
import { type SFSymbol, SymbolView } from 'expo-symbols'
import type { ReactElement } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { strings } from '@/i18n'
import { colors, radii, spacing, touch } from '@/ui/theme'

interface ChildTab {
  icon: SFSymbol
  label: string
}

interface ChildTabButtonProps {
  tab: ChildTab
  isFocused: boolean
  onPress: () => void
}

/** Tab look by route name. Labels are never shown, VoiceOver reads them. */
const TABS: Partial<Record<string, ChildTab>> = {
  'requests': {
    icon: 'square.grid.2x2.fill',
    label: strings.child.requestsTab,
  },
  'pause-game': {
    icon: 'textformat.123',
    label: strings.child.pauseGameTab,
  },
}

const ICON_SIZE = 56

/** Child-mode tab bar: large icon-only buttons. With a single tab there is nothing to switch, so there is no bar. */
export function ChildTabBar({ state, navigation, insets }: BottomTabBarProps): ReactElement | null {
  if (state.routes.length < 2) {
    return null
  }

  function openTab(routeKey: string, routeName: string, isFocused: boolean): void {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    })

    if (isFocused || event.defaultPrevented) {
      return
    }

    navigation.navigate(routeName)
  }

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          paddingBottom: insets.bottom + spacing.sm,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const tab = TABS[route.name]

        if (!tab) {
          return null
        }

        const isFocused = state.index === index

        return (
          <ChildTabButton
            isFocused={isFocused}
            key={route.key}
            onPress={() => openTab(route.key, route.name, isFocused)}
            tab={tab}
          />
        )
      })}
    </View>
  )
}

function ChildTabButton({ tab, isFocused, onPress }: ChildTabButtonProps): ReactElement {
  return (
    <Pressable
      accessibilityLabel={tab.label}
      accessibilityRole="tab"
      accessibilityState={{
        selected: isFocused,
      }}
      onPress={onPress}
      style={[styles.button, isFocused && styles.buttonFocused]}
    >
      <SymbolView name={tab.icon} size={ICON_SIZE} tintColor={isFocused ? colors.accent : colors.textMuted} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
  },
  button: {
    width: touch.child,
    height: touch.child,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
  },
  buttonFocused: {
    backgroundColor: colors.accentSoft,
  },
})
