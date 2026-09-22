import { Redirect } from 'expo-router'
import type { ReactElement } from 'react'
import { useSession } from '@/features/session/session-provider'
import { useSettings } from '@/features/settings/settings-provider'

/**
 * The app opens in child mode: on the board while a session runs, otherwise on the calm start screen. The very first
 * launch opens the onboarding instead, since there is nothing to show the child yet.
 */
export default function Index(): ReactElement {
  const { active } = useSession()
  const settings = useSettings()

  if (!settings.onboardingDone) {
    return <Redirect href="/onboarding" />
  }

  return <Redirect href={active ? '/requests' : '/goodbye'} />
}
