import type { ReactElement } from 'react'
import { Text } from 'react-native'
import { strings } from '@/i18n'
import { Panel } from '@/ui/panel'
import { ParentScreen } from '@/ui/parent-screen'
import { typography } from '@/ui/theme'

/** Sequences for the pause game: ordered items of text, voice and an optional image (SPEC §3, §5); build step 6. */
export default function SequencesScreen(): ReactElement {
  return (
    <ParentScreen title={strings.parent.sequences}>
      <Panel>
        <Text style={typography.body}>{strings.parent.sequencesComingSoon}</Text>
      </Panel>
    </ParentScreen>
  )
}
