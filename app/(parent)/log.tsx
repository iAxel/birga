import type { ReactElement } from 'react'
import { Text } from 'react-native'
import { strings } from '@/i18n'
import { Panel } from '@/ui/panel'
import { ParentScreen } from '@/ui/parent-screen'
import { typography } from '@/ui/theme'

/** Daily summary of the event log and its export via the share sheet (SPEC §5); filled in at build step 8. */
export default function LogScreen(): ReactElement {
  return (
    <ParentScreen title={strings.parent.log}>
      <Panel>
        <Text style={typography.body}>{strings.parent.logComingSoon}</Text>
      </Panel>
    </ParentScreen>
  )
}
