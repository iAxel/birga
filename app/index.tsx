import { Redirect } from 'expo-router'
import type { ReactElement } from 'react'
import { useSession } from '@/features/session/session-provider'

/** The app opens in child mode: on the board while a session runs, otherwise on the calm goodbye screen. */
export default function Index(): ReactElement {
  const { active } = useSession()

  return <Redirect href={active ? '/requests' : '/goodbye'} />
}
