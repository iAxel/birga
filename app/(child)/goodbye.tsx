import type { ReactElement } from 'react'
import { GoodbyeView } from '@/features/session/goodbye-view'
import { useSession } from '@/features/session/session-provider'
import { StartView } from '@/features/session/start-view'

/**
 * Child mode while no session runs; nothing on it reacts to touch except the parent gate (SPEC §4). After a session it
 * says goodbye; when the app opens without one, it shows the calm start screen.
 */
export default function GoodbyeScreen(): ReactElement {
  const { lastEndedSessionId } = useSession()

  if (lastEndedSessionId === null) {
    return <StartView />
  }

  return <GoodbyeView />
}
