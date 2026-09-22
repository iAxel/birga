import { Tabs } from 'expo-router/js-tabs'
import type { ReactElement } from 'react'
import { useEventLog } from '@/features/session/use-event-log'
import { useSettings } from '@/features/settings/settings-provider'
import { ChildTabBar } from '@/ui/child-tab-bar'
import { colors } from '@/ui/theme'

/** Requests, first and open by default, and Pause game, only while the pauseGameEnabled setting is on. Switches are logged. */
export default function ChildTabsLayout(): ReactElement {
  const settings = useSettings()
  const logEvent = useEventLog()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: colors.background,
        },
      }}
      tabBar={(props) => (
        <ChildTabBar
          {...props}
          onSwitch={(to) =>
            logEvent({
              type: 'tab_switch',
              payload: {
                to,
              },
            })
          }
        />
      )}
    >
      <Tabs.Screen name="requests" />
      <Tabs.Protected guard={settings.pauseGameEnabled}>
        <Tabs.Screen name="pause-game" />
      </Tabs.Protected>
    </Tabs>
  )
}
