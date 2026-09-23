import { useRouter } from 'expo-router'
import { type ReactElement, useState } from 'react'
import { Alert, Text } from 'react-native'
import { deleteMedia, storeMedia } from '@/db'
import type { MediaDraft } from '@/features/cards/card-draft'
import { VoiceField } from '@/features/cards/voice-field'
import { useSaveSetting, useSettings } from '@/features/settings/settings-provider'
import { strings } from '@/i18n'
import { ParentButton } from '@/ui/parent-button'
import { ParentScreen } from '@/ui/parent-screen'
import { typography } from '@/ui/theme'

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
  const [isSaving, setIsSaving] = useState(false)

  /** One save at a time: a second tap would store a second file and leave the screen twice, taking Settings with it. */
  async function save(uri: string): Promise<void> {
    const previousPath = settings.goodbyeAudioPath

    setIsSaving(true)

    try {
      await keep(uri)
    } catch {
      setIsSaving(false)

      Alert.alert(strings.error.message)

      return
    }

    if (previousPath) {
      deleteQuietly(previousPath)
    }

    router.back()
  }

  /** Stores the take and points the setting at it; a take stored for a setting that could not be saved goes again. */
  async function keep(uri: string): Promise<void> {
    const path = await storeMedia(uri, 'phrases')

    try {
      await saveSetting('goodbyeAudioPath', path)
    } catch (err) {
      deleteQuietly(path)

      throw err
    }
  }

  async function remove(): Promise<void> {
    const previousPath = settings.goodbyeAudioPath

    setIsSaving(true)

    try {
      await saveSetting('goodbyeAudioPath', null)
    } catch {
      Alert.alert(strings.error.message)

      return
    } finally {
      setIsSaving(false)
    }

    if (previousPath) {
      deleteQuietly(previousPath)
    }

    setAudio(null)
  }

  return (
    <ParentScreen title={strings.goodbyeVoice.title}>
      <Text style={typography.body}>{strings.goodbyeVoice.hint}</Text>
      <VoiceField
        audio={audio}
        levels={null}
        onRecorded={(uri) =>
          setAudio({
            kind: 'captured',
            uri,
          })
        }
      />
      <ParentButton
        disabled={audio?.kind !== 'captured' || isSaving}
        onPress={() => {
          if (audio?.kind === 'captured') {
            save(audio.uri)
          }
        }}
        title={strings.cardEditor.save}
        variant="primary"
      />
      {settings.goodbyeAudioPath && (
        <ParentButton disabled={isSaving} onPress={remove} title={strings.goodbyeVoice.remove} variant="danger" />
      )}
    </ParentScreen>
  )
}

function deleteQuietly(path: string): void {
  try {
    deleteMedia(path)
  } catch {
    return
  }
}
