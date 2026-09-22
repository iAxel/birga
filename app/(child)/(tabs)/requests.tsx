import type { ReactElement } from 'react'
import { RequestsView } from '@/features/requests/requests-view'

/** Card grid of the active board: photo, written word, the parent's voice (SPEC §2). */
export default function RequestsScreen(): ReactElement {
  return <RequestsView />
}
