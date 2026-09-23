import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { type ReactElement, useCallback, useState } from 'react'
import { Alert, Text } from 'react-native'
import { type Sequence, type SequenceItem, useRepositories } from '@/db'
import { MIN_SEQUENCE_ITEMS } from '@/features/pauseGame/pause-round'
import { SequenceItemRow } from '@/features/sequences/sequence-item-row'
import { strings } from '@/i18n'
import { alertOnFailure } from '@/ui/alert-on-failure'
import { Badge, Panel } from '@/ui/panel'
import { ParentButton } from '@/ui/parent-button'
import { ParentScreen } from '@/ui/parent-screen'
import { parseIdParam } from '@/ui/route-params'
import { typography } from '@/ui/theme'

/**
 * One sequence: its items in the order the app says them, whether the pause game plays it, adding and ordering items.
 * An item without the parent's voice is marked: the game cannot say it.
 */
export default function SequenceScreen(): ReactElement | null {
  const params = useLocalSearchParams<{ sequenceId: string }>()
  const sequenceId = parseIdParam(params.sequenceId)
  const router = useRouter()
  const repositories = useRepositories()
  /** Undefined while loading, null for a sequence that does not exist. */
  const [sequence, setSequence] = useState<Sequence | null | undefined>(undefined)
  const [items, setItems] = useState<SequenceItem[]>([])

  const reload = useCallback(async (): Promise<void> => {
    if (sequenceId === null) {
      setSequence(null)

      return
    }

    setSequence(await repositories.sequences.get(sequenceId))
    setItems(await repositories.sequences.listItems(sequenceId))
  }, [repositories, sequenceId])

  useFocusEffect(
    useCallback(() => {
      alertOnFailure(reload)
    }, [reload]),
  )

  async function moveItem(itemId: number, offset: -1 | 1): Promise<void> {
    await repositories.sequences.moveItem(itemId, offset)

    await reload()
  }

  async function activate(): Promise<void> {
    if (!sequence) {
      return
    }

    await repositories.sequences.activate(sequence.id)

    await reload()
  }

  function askForTitle(): void {
    if (!sequence) {
      return
    }

    Alert.prompt(
      strings.sequences.namePrompt,
      undefined,
      (title) => alertOnFailure(() => rename(title)),
      'plain-text',
      sequence.title,
    )
  }

  async function rename(title: string): Promise<void> {
    if (!sequence || !title.trim()) {
      return
    }

    await repositories.sequences.rename(sequence.id, title)

    await reload()
  }

  function openItem(itemId: number): void {
    router.push({
      pathname: '/sequence-item/[itemId]',
      params: {
        itemId,
      },
    })
  }

  function addItem(): void {
    if (!sequence) {
      return
    }

    router.push({
      pathname: '/sequence-item/new',
      params: {
        sequenceId: sequence.id,
      },
    })
  }

  if (sequence === undefined) {
    return null
  }

  if (sequence === null) {
    return (
      <ParentScreen title={strings.sequences.title}>
        <Text style={typography.body}>{strings.common.missing}</Text>
      </ParentScreen>
    )
  }

  const playable = items.filter((item) => item.audioPath !== null)

  return (
    <ParentScreen
      accessory={sequence.isActive && <Badge title={strings.sequences.active} />}
      footer={<ParentButton icon="plus" onPress={addItem} title={strings.sequences.addItem} variant="primary" />}
      title={sequence.title}
    >
      {!sequence.isActive && (
        <ParentButton onPress={() => alertOnFailure(activate)} title={strings.sequences.activate} variant="secondary" />
      )}
      <Text style={typography.body}>{strings.sequences.itemsHint}</Text>
      {playable.length < MIN_SEQUENCE_ITEMS && (
        <Panel>
          <Text style={typography.body}>{strings.sequences.tooShort}</Text>
        </Panel>
      )}
      {items.length > 0 && (
        <Panel hasRows>
          {items.map((item, index) => (
            <SequenceItemRow
              canMoveDown={index < items.length - 1}
              canMoveUp={index > 0}
              hasSeparator={index < items.length - 1}
              item={item}
              key={item.id}
              onMove={(offset) => alertOnFailure(() => moveItem(item.id, offset))}
              onOpen={() => openItem(item.id)}
            />
          ))}
        </Panel>
      )}
      <ParentButton onPress={askForTitle} title={strings.sequences.rename} />
    </ParentScreen>
  )
}
