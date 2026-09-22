import { Tabs } from 'expo-router/js-tabs'
import type { ReactElement } from 'react'
import { useSettings } from '@/features/settings/settings-provider'
import { ChildTabBar } from '@/ui/child-tab-bar'
import { colors } from '@/ui/theme'

/** Requests, first and open by default, and Pause game, only while the pauseGameEnabled setting is on. */
export default function ChildTabsLayout(): ReactElement {
  const settings = useSettings()

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
      <Tabs.Protected guard={settings.pauseGameEnabled}>
        <Tabs.Screen name="pause-game" />
      </Tabs.Protected>
    </Tabs>
  )
}
