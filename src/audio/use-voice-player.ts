import { type AudioPlayer, useAudioPlayer } from 'expo-audio'

/**
 * A player for the parent's recordings that never switches the audio session off. By default expo-audio deactivates the
 * session on pause and when playback ends, and iOS then stops any recording that is running at that moment.
 */
export function useVoicePlayer(): AudioPlayer {
  return useAudioPlayer(null, {
    keepAudioSessionActive: true,
  })
}
