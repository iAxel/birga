import { useSQLiteContext } from 'expo-sqlite'
import { createContext, type PropsWithChildren, type ReactElement, useContext, useEffect, useState } from 'react'
import { type Settings, SettingsRepository } from '@/db'

const SettingsContext = createContext<Settings | null>(null)

/** Loads the settings once the database is ready and holds its children back until then. */
export function SettingsProvider({ children }: PropsWithChildren): ReactElement | null {
  const db = useSQLiteContext()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    new SettingsRepository(db).load().then(setSettings, setError)
  }, [db])

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
