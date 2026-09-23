import { Alert } from 'react-native'
import { strings } from '@/i18n'

/**
 * Runs something the parent asked for and says so when it fails. Without it a failed write was a rejected promise
 * nobody heard: the button seemed to do nothing, and the parent could not tell a slow tap from a lost change.
 */
export async function alertOnFailure(action: () => Promise<unknown>): Promise<void> {
  try {
    await action()
  } catch {
    Alert.alert(strings.error.message)
  }
}
