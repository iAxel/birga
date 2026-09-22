import { createContext, type PropsWithChildren, type ReactElement, useContext, useEffect, useState } from 'react'
import { type Settings, useRepositories } from '@/db'

type SaveSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>

interface SettingsContextValue {
  settings: Settings
  save: SaveSetting
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

/** Loads the settings once the database is ready and holds its children back until then. */
export function SettingsProvider({ children }: PropsWithChildren): ReactElement | null {
  const repositories = useRepositories()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    repositories.settings.load().then(setSettings, setError)
  }, [repositories])

  async function save<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
    await repositories.settings.save(key, value)

    setSettings((current) => current && { ...current, [key]: value })
  }

  if (error) {
    throw error
  }

  if (!settings) {
    return null
  }

  return (
    <SettingsContext
      value={{
        settings,
        save,
      }}
    >
      {children}
    </SettingsContext>
  )
}

export function useSettings(): Settings {
  return useSettingsContext().settings
}

/** Stores a setting and updates every screen that reads it. */
export function useSaveSetting(): SaveSetting {
  return useSettingsContext().save
}

function useSettingsContext(): SettingsContextValue {
  const value = useContext(SettingsContext)

  if (!value) {
    throw new Error('SETTINGS_PROVIDER_MISSING')
  }

  return value
}
