import { type ErrorBoundaryProps, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { type ReactElement, useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { configureAudioSession } from '@/audio/audio-session'
import { discardStrayTakes } from '@/audio/takes'
import { DatabaseProvider } from '@/db'
import { SessionProvider } from '@/features/session/session-provider'
import { SettingsProvider } from '@/features/settings/settings-provider'
import { strings } from '@/i18n'
import { useAppFonts } from '@/ui/fonts'
import { color, radius, space, touch, typography } from '@/ui/theme'

SplashScreen.preventAutoHideAsync()

configureAudioSession().catch(() => undefined)

discardStrayTakes()

/**
 * No screen renders until the fonts are loaded and the database, settings and sessions are ready; the splash screen
 * covers that. The fonts are awaited here, above the providers: SQLiteProvider is memoised on its own props and drops
 * a children element that changes after it has mounted, so nothing below it may depend on a value from above.
 */
export default function RootLayout(): ReactElement | null {
  const areFontsReady = useAppFonts()

  if (!areFontsReady) {
    return null
  }

  return (
    <DatabaseProvider>
      <SettingsProvider>
        <SessionProvider>
          <RootStack />
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
