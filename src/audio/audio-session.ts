import { setAudioModeAsync } from 'expo-audio'

/**
 * One audio session for the whole app, configured at start: playback ignores the silent switch and recording needs no
 * session change later. Output stays on the loudspeaker although the session also records.
 */
export async function configureAudioSession(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,
    allowsRecording: true,
    shouldRouteThroughEarpiece: false,
  })
}
