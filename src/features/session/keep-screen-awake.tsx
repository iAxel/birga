import { useKeepAwake } from 'expo-keep-awake'

/**
 * Keeps the screen on for as long as it is mounted (SPEC §4). Child mode mounts it while a session runs: a round of
 * the pause game passes with nobody touching the screen, and iOS would lock it halfway through. Expo does the same by
 * itself only in a development build, which is why Expo Go never showed the problem.
 */
export function KeepScreenAwake(): null {
  useKeepAwake()

  return null
}
