import { SymbolView } from 'expo-symbols'
import type { ReactElement } from 'react'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useVoicePlayer } from '@/audio/use-voice-player'
import { MAX_RECORDING_MS, useVoiceRecorder } from '@/audio/use-voice-recorder'
import { type MediaDraft, mediaDraftUri } from '@/features/cards/card-draft'
import { strings } from '@/i18n'
import { ParentButton } from '@/ui/parent-button'
import { color, radius, space, touch, typography } from '@/ui/theme'

interface VoiceFieldProps {
  audio: MediaDraft | null
  onRecorded: (uri: string) => void
}

/** The parent's voice: hold and speak (4 s at most), release to stop, listen back, hold again to re-record. */
export function VoiceField({ audio, onRecorded }: VoiceFieldProps): ReactElement {
  const player = useVoicePlayer()
  const recorder = useVoiceRecorder(onRecorded)
  const progress = useSharedValue(0)
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.get() * 100}%`,
  }))

  function startRecording(): void {
    if (player.playing) {
      player.pause()
    }

    if (!recorder.start()) {
      return
    }

    progress.set(
      withTiming(1, {
        duration: MAX_RECORDING_MS,
        easing: Easing.linear,
      }),
    )
  }

  async function stopRecording(): Promise<void> {
    cancelAnimation(progress)
    progress.set(0)

    await recorder.stop()
  }

  function play(): void {
    if (!audio) {
      return
    }

    player.replace({
      uri: mediaDraftUri(audio),
    })
    player.play()
  }

  if (recorder.access === 'denied') {
    return (
      <View style={styles.field}>
        <Text style={typography.body}>{strings.cardEditor.voice}</Text>
        <Text style={typography.row}>{strings.cardEditor.microphoneDenied}</Text>
        <ParentButton onPress={() => Linking.openSettings()} title={strings.common.openSettings} />
      </View>
    )
  }

  return (
    <View style={styles.field}>
      <Text style={typography.body}>{strings.cardEditor.voice}</Text>
      <Pressable
        accessibilityLabel={strings.cardEditor.holdToRecord}
        accessibilityRole="button"
        disabled={recorder.access !== 'granted'}
        onPressIn={startRecording}
        onPressOut={stopRecording}
        style={[styles.record, recorder.isRecording && styles.recording]}
      >
        <SymbolView name="mic.fill" size={28} tintColor={recorder.isRecording ? color.card : color.accent} />
        <Text style={[typography.row, recorder.isRecording && styles.recordingText]}>
          {recorder.isRecording ? strings.cardEditor.recording : strings.cardEditor.holdToRecord}
        </Text>
      </Pressable>
      <View style={styles.track}>
        <Animated.View style={[styles.progress, progressStyle]} />
      </View>
      {audio && <ParentButton onPress={play} title={strings.cardEditor.play} />}
    </View>
  )
}

const styles = StyleSheet.create({
  field: {
    gap: space.sm,
  },
  record: {
    minHeight: touch.parent * 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderRadius: radius.button,
    backgroundColor: color.accentBg,
  },
  recording: {
    backgroundColor: color.accent,
  },
  recordingText: {
    color: color.card,
  },
  track: {
    height: 4,
    overflow: 'hidden',
    borderRadius: 2,
    backgroundColor: color.card,
  },
  progress: {
    height: 4,
    backgroundColor: color.accent,
  },
})
