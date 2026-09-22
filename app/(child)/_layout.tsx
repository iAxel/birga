import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import type { ReactElement } from 'react'
import { StyleSheet, View } from 'react-native'
import { ParentGate } from '@/features/session/parent-gate'
import { SessionCountdown } from '@/features/session/session-countdown'
import { useSession } from '@/features/session/session-provider'
import { colors } from '@/ui/theme'

/**
 * Child mode: no headers, no gestures, no status bar; the countdown and the parent gate sit above every child screen.
 * The screens follow the session: the board while one runs, the goodbye screen otherwise.
 */
export default function ChildLayout(): ReactElement {
  const { active } = useSession()

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          animation: 'fade',
          contentStyle: {
            backgroundColor: colors.background,
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
    backgroundColor: colors.background,
  },
})
