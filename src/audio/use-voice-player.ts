import { type AudioPlayer, useAudioPlayer } from 'expo-audio'
import { LEVEL_INTERVAL_MS } from '@/audio/metering'

/**
 * A player for the parent's recordings that never switches the audio session off. By default expo-audio deactivates the
 * session on pause and when playback ends, and iOS then stops any recording that is running at that moment.
 *
 * It reports its position as often as the card editor has bars to fill, so playback runs along the waveform.
 */
export function useVoicePlayer(): AudioPlayer {
  return useAudioPlayer(null, {
    keepAudioSessionActive: true,
    updateInterval: LEVEL_INTERVAL_MS,
  })
}
