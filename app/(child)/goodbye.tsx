import type { ReactElement } from 'react'
import { GoodbyeView } from '@/features/session/goodbye-view'

/** End of a session: a calm screen, nothing on it reacts to touch except the parent gate (SPEC §4). */
export default function GoodbyeScreen(): ReactElement {
  return <GoodbyeView />
}
