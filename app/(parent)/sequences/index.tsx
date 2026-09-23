import { useRouter } from 'expo-router'
import { type ReactElement, useCallback } from 'react'
import { Alert, Text } from 'react-native'
import { useRepositories } from '@/db'
import { useFocusQuery } from '@/db/use-focus-query'
import { useSettings } from '@/features/settings/settings-provider'
import { strings } from '@/i18n'
import { ListRow, Panel } from '@/ui/panel'
import { ParentButton } from '@/ui/parent-button'
import { ParentScreen } from '@/ui/parent-screen'
import { typography } from '@/ui/theme'

/** The sequences of the pause game, with the one the child hears marked (SPEC §3). */
export default function SequencesScreen(): ReactElement | null {
  const router = useRouter()
  const { sequences: sequencesRepository } = useRepositories()
  const settings = useSettings()
  const sequences = useFocusQuery(useCallback(() => sequencesRepository.list(), [sequencesRepository]))

  function askForTitle(): void {
    Alert.prompt(strings.sequences.namePrompt, undefined, createSequence)
  }

  async function createSequence(title: string): Promise<void> {
    if (!title.trim()) {
      return
    }

    openSequence(await sequencesRepository.create(title))
  }

  function openSequence(sequenceId: number): void {
    router.push({
      pathname: '/sequences/[sequenceId]',
      params: {
        sequenceId,
      },
    })
  }

  if (!sequences) {
    return null
  }

  return (
    <ParentScreen
      footer={<ParentButton icon="plus" onPress={askForTitle} title={strings.sequences.add} variant="primary" />}
      title={strings.sequences.title}
    >
      {sequences.length === 0 ? (
        <Panel>
          <Text style={typography.body}>{strings.sequences.empty}</Text>
        </Panel>
      ) : (
        <Panel hasRows>
          {sequences.map((sequence, index) => (
            <ListRow
              hasSeparator={index < sequences.length - 1}
              key={sequence.id}
              onPress={() => openSequence(sequence.id)}
              title={sequence.title}
              value={sequence.isActive ? strings.sequences.active : undefined}
            />
          ))}
        </Panel>
      )}
      <Text style={typography.body}>{strings.sequences.roundsNote(settings.roundsPerGame)}</Text>
    </ParentScreen>
  )
}
