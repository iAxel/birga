import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'

/**
 * Reads from the database whenever the screen comes into view, which is how a screen picks up what the parent changed
 * elsewhere. The value is undefined until the first read. A read that fails leaves the last value in place instead of
 * throwing into nowhere: the database is local, so a failure means the app is going down anyway, and a half-written
 * screen is of no use to anyone.
 */
export function useFocusQuery<T>(query: () => Promise<T>): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined)

  useFocusEffect(
    useCallback(() => {
      let isCurrent = true

      query().then(
        (result) => {
          if (isCurrent) {
            setValue(result)
          }
        },
        () => undefined,
      )

      return () => {
        isCurrent = false
      }
    }, [query]),
  )

  return value
}
