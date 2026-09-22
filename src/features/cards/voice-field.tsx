import { useAudioPlayerStatus } from 'expo-audio'
import { SymbolView } from 'expo-symbols'
import { type ReactElement, useEffect } from 'react'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useVoicePlayer } from '@/audio/use-voice-player'
import { MAX_RECORDING_MS, useVoiceRecorder } from '@/audio/use-voice-recorder'
import { type MediaDraft, mediaDraftUri } from '@/features/cards/card-draft'
import { strings } from '@/i18n'
import { Panel, SectionLabel } from '@/ui/panel'
import { ParentButton } from '@/ui/parent-button'
import { color, radius, space, typography } from '@/ui/theme'

const RECORD_BUTTON_HEIGHT = 48

const TRACK_HEIGHT = 4

interface VoiceFieldProps {
  audio: MediaDraft | null
  onRecorded: (uri: string) => void
}

/**
 * The parent's voice (DESIGN §3, OVOZ): hold and speak (4 s at most), release to stop, listen back, hold again to
 * re-record. The recording is loaded into the preview player as soon as it exists, which also tells its length.
 */
export function VoiceField({ audio, onRecorded }: VoiceFieldProps): ReactElement {
  const player = useVoicePlayer()
  const playerStatus = useAudioPlayerStatus(player)
  const recorder = useVoiceRecorder(onRecorded)
  const progress = useSharedValue(0)
  const audioUri = audio ? mediaDraftUri(audio) : null
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.get() * 100}%`,
  }))

  useEffect(() => {
    if (audioUri) {
      player.replace({
        uri: audioUri,
      })
    }
  }, [player, audioUri])

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
    if (!audioUri) {
      return
    }

    player.replace({
      uri: audioUri,
    })
    player.play()
  }

  if (recorder.access === 'denied') {
    return (
      <Panel>
        <SectionLabel title={strings.cardEditor.voice} />
        <Text style={typography.row}>{strings.cardEditor.microphoneDenied}</Text>
        <ParentButton onPress={() => Linking.openSettings()} title={strings.common.openSettings} />
      </Panel>
    )
  }

  return (
    <Panel>
      <SectionLabel
        note={<VoiceStatus audio={audio} durationSeconds={playerStatus.duration} isRecording={recorder.isRecording} />}
        title={strings.cardEditor.voice}
      />
      <View style={styles.track}>
        <Animated.View style={[styles.progress, progressStyle]} />
      </View>
      <View style={styles.actions}>
        {audio && <ParentButton icon="play.fill" onPress={play} style={styles.action} title={strings.cardEditor.play} />}
        <Pressable
          accessibilityLabel={strings.cardEditor.holdToRecord}
          accessibilityRole="button"
          disabled={recorder.access !== 'granted'}
          onPressIn={startRecording}
          onPressOut={stopRecording}
          style={[styles.record, styles.action, recorder.isRecording && styles.recording]}
        >
          <SymbolView name="mic" size={18} tintColor={recorder.isRecording ? color.card : color.ink} />
          <Text style={[typography.button, recorder.isRecording && styles.recordingText]}>
            {recordLabel(recorder.isRecording, audio !== null)}
          </Text>
        </Pressable>
      </View>
      <Text style={typography.hint}>{strings.cardEditor.voiceHint}</Text>
    </Panel>
  )
}

interface VoiceStatusProps {
  audio: MediaDraft | null
  durationSeconds: number
  isRecording: boolean
}

/** "1.2 s yozildi" once the recording is loaded; accent while there is a recording, muted without one. */
function VoiceStatus({ audio, durationSeconds, isRecording }: VoiceStatusProps): ReactElement {
  if (isRecording) {
    return <Text style={[typography.body, styles.ready]}>{strings.cardEditor.recording}</Text>
  }

  if (!audio) {
    return <Text style={typography.body}>{strings.cardEditor.voiceMissing}</Text>
  }

  return (
    <Text style={[typography.body, styles.ready]}>
      {durationSeconds > 0 ? strings.cardEditor.voiceLength(durationSeconds.toFixed(1)) : strings.cardEditor.voiceReady}
    </Text>
  )
}

function recordLabel(isRecording: boolean, hasAudio: boolean): string {
  if (isRecording) {
    return strings.cardEditor.recording
  }

  return hasAudio ? strings.cardEditor.reRecord : strings.cardEditor.holdToRecord
}

const styles = StyleSheet.create({
  track: {
    height: TRACK_HEIGHT,
    overflow: 'hidden',
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: color.panelAlt,
  },
  progress: {
    height: TRACK_HEIGHT,
    backgroundColor: color.accent,
  },
  actions: {
    flexDirection: 'row',
    gap: space.sm,
  },
  action: {
    flex: 1,
  },
  record: {
    minHeight: RECORD_BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.buttonSm,
    backgroundColor: color.panelAlt,
  },
  recording: {
    backgroundColor: color.accent,
  },
  recordingText: {
    color: color.card,
  },
  ready: {
    color: color.accent,
  },
})
