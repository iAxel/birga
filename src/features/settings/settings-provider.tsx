import { createContext, type PropsWithChildren, type ReactElement, useContext, useEffect, useState } from 'react'
import { type Settings, useRepositories } from '@/db'

const SettingsContext = createContext<Settings | null>(null)

/** Loads the settings once the database is ready and holds its children back until then. */
export function SettingsProvider({ children }: PropsWithChildren): ReactElement | null {
  const repositories = useRepositories()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    repositories.settings.load().then(setSettings, setError)
  }, [repositories])

  if (error) {
    throw error
  }

  if (!settings) {
    return null
  }

  return <SettingsContext value={settings}>{children}</SettingsContext>
}

export function useSettings(): Settings {
  const settings = useContext(SettingsContext)

  if (!settings) {
    throw new Error('SETTINGS_PROVIDER_MISSING')
  }

  return settings
}
