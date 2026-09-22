import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import type { ReactElement } from 'react'
import { StyleSheet, View } from 'react-native'
import { ParentGate } from '@/features/session/parent-gate'
import { colors } from '@/ui/theme'

/** Child mode: no headers, no gestures, no status bar; the parent gate sits above every child screen. */
export default function ChildLayout(): ReactElement {
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
      />
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
