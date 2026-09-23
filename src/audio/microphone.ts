import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio'

/**
 * Whether the microphone is already allowed, without asking. A screen the child is looking at may check this, but must
 * never ask: the system dialog belongs to parent mode.
 */
export async function hasMicrophone(): Promise<boolean> {
  try {
    const permission = await getRecordingPermissionsAsync()

    return permission.granted
  } catch {
    return false
  }
}

/**
 * Asks for the microphone, which the app needs for the pause game and for recording an attempt. It is asked when the
 * parent starts a session (SPEC §4), so the dialog comes up in parent mode rather than in front of the child. A refusal
 * changes nothing else: the session runs, only without listening.
 */
export async function askForMicrophone(): Promise<boolean> {
  try {
    const permission = await requestRecordingPermissionsAsync()

    return permission.granted
  } catch {
    return false
  }
}
