import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import type { ReactElement } from 'react'
import { color } from '@/ui/theme'

/** Parent mode: an iOS navigation stack with swipe-back; the status bar is back. Every screen draws its own header. */
export default function ParentLayout(): ReactElement {
  return (
    <>
      <StatusBar hidden={false} style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: color.ground,
          },
        }}
      />
    </>
  )
}
