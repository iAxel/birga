import { type ErrorBoundaryProps, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { type ReactElement, useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { configureAudioSession } from '@/audio/audio-session'
import { DatabaseProvider } from '@/db'
import { SettingsProvider } from '@/features/settings/settings-provider'
import { strings } from '@/i18n'
import { colors, radii, spacing, touch, typography } from '@/ui/theme'

SplashScreen.preventAutoHideAsync()

configureAudioSession()

/** No screen renders until the database is migrated and the settings are loaded; the splash screen covers that time. */
export default function RootLayout(): ReactElement {
  return (
    <DatabaseProvider>
      <SettingsProvider>
        <RootStack />
      </SettingsProvider>
    </DatabaseProvider>
  )
}

/** Shown if the database fails to open or a screen crashes. Neutral wording: the child may be the one looking. */
export function ErrorBoundary({ retry }: ErrorBoundaryProps): ReactElement {
  useEffect(() => {
    SplashScreen.hide()
  }, [])

  return (
    <View style={styles.error}>
      <Text style={typography.caption}>{strings.error.message}</Text>
      <Pressable onPress={retry} style={styles.reload}>
        <Text style={typography.body}>{strings.error.reload}</Text>
      </Pressable>
    </View>
  )
}

/** Child and parent modes. No swipe-back between them: leaving parent mode goes through its own button. */
function RootStack(): ReactElement {
  useEffect(() => {
    SplashScreen.hide()
  }, [])

  return (
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
  )
}

const styles = StyleSheet.create({
  error: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  reload: {
    minHeight: touch.parent,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
})
