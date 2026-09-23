import { setAudioModeAsync } from 'expo-audio'
import { AppState } from 'react-native'

/**
 * One audio session for the whole app: playback ignores the silent switch, recording needs no session change later,
 * and output stays on the loudspeaker although the session also records. Other apps fall silent while the app plays:
 * music left running in another app would compete with the parent's voice and reach the detector as the child.
 */
export async function configureAudioSession(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,
    allowsRecording: true,
    shouldRouteThroughEarpiece: false,
    interruptionMode: 'doNotMix',
  })
}

/**
 * Configures the session at start-up and again whenever the app comes back to the foreground. A configuration that
 * failed would leave every recording refused for the life of the app; this way the next return tries again.
 */
export function keepAudioSessionConfigured(): void {
  configureAudioSession().catch(() => undefined)

  AppState.addEventListener('change', (next) => {
    if (next === 'active') {
      configureAudioSession().catch(() => undefined)
    }
  })
}
