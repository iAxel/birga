import { useRouter } from 'expo-router'
import { type ReactElement, useState } from 'react'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { deleteMedia, storeMedia } from '@/db'
import type { MediaDraft } from '@/features/cards/card-draft'
import { VoiceField } from '@/features/cards/voice-field'
import { useSaveSetting, useSettings } from '@/features/settings/settings-provider'
import { strings } from '@/i18n'
import { ParentButton } from '@/ui/parent-button'
import { space, typography } from '@/ui/theme'

/** The parent's "Xayr!" that the child hears at the end of a session (SPEC §4); recording it is optional. */
export default function GoodbyeVoiceScreen(): ReactElement {
  const router = useRouter()
  const settings = useSettings()
  const saveSetting = useSaveSetting()
  const [audio, setAudio] = useState<MediaDraft | null>(
    settings.goodbyeAudioPath
      ? {
          kind: 'stored',
          path: settings.goodbyeAudioPath,
        }
      : null,
  )

  async function save(uri: string): Promise<void> {
    const previousPath = settings.goodbyeAudioPath
    const path = await storeMedia(uri, 'phrases')

    await saveSetting('goodbyeAudioPath', path)

    if (previousPath) {
      deleteMedia(previousPath)
    }

    router.back()
  }

  async function remove(): Promise<void> {
    const previousPath = settings.goodbyeAudioPath

    await saveSetting('goodbyeAudioPath', null)

    if (previousPath) {
      deleteMedia(previousPath)
    }

    setAudio(null)
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={typography.body}>{strings.goodbyeVoice.hint}</Text>
      <VoiceField
        audio={audio}
        onRecorded={(uri) =>
          setAudio({
            kind: 'captured',
            uri,
          })
        }
      />
      <ParentButton
        disabled={audio?.kind !== 'captured'}
        onPress={() => {
          if (audio?.kind === 'captured') {
            save(audio.uri)
          }
        }}
        title={strings.cardEditor.save}
        variant="primary"
      />
      {settings.goodbyeAudioPath && <ParentButton onPress={remove} title={strings.goodbyeVoice.remove} variant="danger" />}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: space.parentPad,
    padding: space.parentPad,
  },
})
