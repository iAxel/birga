import { type ErrorBoundaryProps, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { type ReactElement, useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { configureAudioSession } from '@/audio/audio-session'
import { DatabaseProvider } from '@/db'
import { SessionProvider } from '@/features/session/session-provider'
import { SettingsProvider } from '@/features/settings/settings-provider'
import { strings } from '@/i18n'
import { useAppFonts } from '@/ui/fonts'
import { color, radius, space, touch, typography } from '@/ui/theme'

SplashScreen.preventAutoHideAsync()

configureAudioSession()

interface RootStackProps {
  areFontsReady: boolean
}

/**
 * No screen renders until the database is migrated, settings and sessions are ready and the fonts are loaded; the splash
 * screen covers that. The fonts load while the database opens.
 */
export default function RootLayout(): ReactElement {
  const areFontsReady = useAppFonts()

  return (
    <DatabaseProvider>
      <SettingsProvider>
        <SessionProvider>
          <RootStack areFontsReady={areFontsReady} />
        </SessionProvider>
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
      <Text style={typography.body}>{strings.error.message}</Text>
      <Pressable onPress={retry} style={styles.reload}>
        <Text style={typography.row}>{strings.error.reload}</Text>
      </Pressable>
    </View>
  )
}

/** Child and parent modes. No swipe-back between them: leaving parent mode goes through its own button. */
function RootStack({ areFontsReady }: RootStackProps): ReactElement | null {
  useEffect(() => {
    if (areFontsReady) {
      SplashScreen.hide()
    }
  }, [areFontsReady])

  if (!areFontsReady) {
    return null
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: 'fade',
        contentStyle: {
          backgroundColor: color.ground,
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
    gap: space.md,
    backgroundColor: color.ground,
  },
  reload: {
    minHeight: touch.parent,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    borderRadius: radius.button,
    backgroundColor: color.card,
  },
})
