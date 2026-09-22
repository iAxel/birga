import { Tabs } from 'expo-router/js-tabs'
import type { ReactElement } from 'react'
import { ChildTabBar } from '@/ui/child-tab-bar'
import { colors } from '@/ui/theme'

/** Requests and Pause game, switched by the large buttons of ChildTabBar. Requests is first and opens by default. */
export default function ChildTabsLayout(): ReactElement {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: colors.background,
        },
      }}
      tabBar={(props) => <ChildTabBar {...props} />}
    >
      <Tabs.Screen name="requests" />
      <Tabs.Screen name="pause-game" />
    </Tabs>
  )
}
