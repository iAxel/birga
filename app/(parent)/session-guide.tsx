import type { ReactElement } from 'react'
import { SessionGuide } from '@/features/parent/session-guide'
import { strings } from '@/i18n'
import { ParentScreen } from '@/ui/parent-screen'

/** How a session goes (SPEC §5): the script the parent reads before playing, and again whenever it slips. */
export default function SessionGuideScreen(): ReactElement {
  return (
    <ParentScreen title={strings.sessionGuide.title}>
      <SessionGuide hasPanels />
    </ParentScreen>
  )
}
