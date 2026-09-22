import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import type { ReactElement } from 'react'
import { strings } from '@/i18n'
import { colors } from '@/ui/theme'

/** Parent mode: a regular iOS navigation stack with headers; the status bar is back. */
export default function ParentLayout(): ReactElement {
  return (
    <>
      <StatusBar hidden={false} style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="parent"
          options={{
            title: strings.parent.title,
          }}
        />
        <Stack.Screen
          name="cards/index"
          options={{
            title: strings.parent.cards,
          }}
        />
        <Stack.Screen
          name="cards/[boardId]"
          options={{
            title: '',
          }}
        />
        <Stack.Screen
          name="card/new"
          options={{
            title: strings.cardEditor.newTitle,
          }}
        />
        <Stack.Screen
          name="card/[cardId]"
          options={{
            title: strings.cardEditor.editTitle,
          }}
        />
        <Stack.Screen
          name="sequences"
          options={{
            title: strings.parent.sequences,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: strings.parent.settings,
          }}
        />
        <Stack.Screen
          name="goodbye-voice"
          options={{
            title: strings.goodbyeVoice.title,
          }}
        />
        <Stack.Screen
          name="log"
          options={{
            title: strings.parent.log,
          }}
        />
      </Stack>
    </>
  )
}
