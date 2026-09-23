import { type AudioPlayer, useAudioPlayer } from 'expo-audio'
import { useEffect, useState } from 'react'
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

/**
 * Whether the voice is sounding right now. The player reports itself ten times a second so the card editor can draw
 * playback along the waveform; a screen that only needs the fact takes it from here instead, and re-renders twice a
 * recording rather than ten times a second.
 */
export function useIsVoicePlaying(player: AudioPlayer): boolean {
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', (status) => setIsPlaying(status.playing))

    return () => subscription.remove()
  }, [player])

  return isPlaying
}

/**
 * Silences the player whatever it is doing. It is paused even when it does not report itself playing: right after
 * play() it is still waiting for its file, and would start a moment later on a screen that has moved on. A screen may
 * leave after the player behind it has been released, and reaching into a released native object throws, so the
 * attempt is allowed to fail.
 */
export function stopVoice(player: AudioPlayer): void {
  try {
    player.pause()
  } catch {
    return
  }
}
