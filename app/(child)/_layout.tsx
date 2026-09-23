import { Stack, useIsFocused } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import type { ReactElement } from 'react'
import { StyleSheet, View } from 'react-native'
import { KeepScreenAwake } from '@/features/session/keep-screen-awake'
import { ParentGate } from '@/features/session/parent-gate'
import { SessionCountdown } from '@/features/session/session-countdown'
import { useSession } from '@/features/session/session-provider'
import { color } from '@/ui/theme'

/**
 * Child mode: no headers, no gestures, no status bar; the countdown and the parent gate sit above every child screen.
 * The screens follow the session: the board while one runs, the goodbye screen otherwise. While a session runs and
 * child mode is on screen, the screen stays on.
 */
export default function ChildLayout(): ReactElement {
  const { active } = useSession()
  const isFocused = useIsFocused()

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      {active !== null && isFocused && <KeepScreenAwake />}
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          animation: 'fade',
          contentStyle: {
            backgroundColor: color.ground,
          },
        }}
      >
        <Stack.Protected guard={active !== null}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={active === null}>
          <Stack.Screen name="goodbye" />
        </Stack.Protected>
      </Stack>
      <SessionCountdown />
      <ParentGate />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.ground,
  },
})
