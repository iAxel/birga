import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import type { ReactElement } from 'react'
import { strings } from '@/i18n'
import { color, font } from '@/ui/theme'

/**
 * Parent mode: an iOS navigation stack with swipe-back; the status bar is back. The designed screens draw their own
 * header (ParentScreen); the settings screens keep the native one.
 */
export default function ParentLayout(): ReactElement {
  return (
    <>
      <StatusBar hidden={false} style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: {
            backgroundColor: color.ground,
          },
          headerTintColor: color.accent,
          headerTitleStyle: {
            color: color.ink,
            fontFamily: font.bold,
          },
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: color.ground,
          },
        }}
      >
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            title: strings.parent.settings,
          }}
        />
        <Stack.Screen
          name="goodbye-voice"
          options={{
            headerShown: true,
            title: strings.goodbyeVoice.title,
          }}
        />
      </Stack>
    </>
  )
}
