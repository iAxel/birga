import { useRouter } from 'expo-router'
import { type ReactElement, useEffect, useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native'
import { type Sequence, type SequenceItem, useRepositories } from '@/db'
import { PhotoField } from '@/features/cards/photo-field'
import { VoiceField } from '@/features/cards/voice-field'
import {
  draftFromItem,
  emptyItemDraft,
  isItemDraftComplete,
  saveSequenceItem,
  type SequenceItemDraft,
} from '@/features/sequences/sequence-item-draft'
import { strings } from '@/i18n'
import { ChipGroup } from '@/ui/chips'
import { fontForText } from '@/ui/fonts'
import { Panel, SectionLabel } from '@/ui/panel'
import { ParentButton } from '@/ui/parent-button'
import { ParentScreen } from '@/ui/parent-screen'
import { color, font, radius, space, typography } from '@/ui/theme'

const WORD_HEIGHT = 56

const SYMBOL_SIZE = 72

interface SequenceItemEditorProps {
  itemId: number | null
  sequenceId: number | null
}

/** One step of a sequence (SPEC §3, §5): the word, an optional character above it, the parent's voice, an optional photo. */
export function SequenceItemEditor({ itemId, sequenceId }: SequenceItemEditorProps): ReactElement | null {
  const router = useRouter()
  const repositories = useRepositories()
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [original, setOriginal] = useState<SequenceItem | null>(null)
  const [draft, setDraft] = useState<SequenceItemDraft | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function load(): Promise<void> {
      setSequences(await repositories.sequences.list())

      const item = itemId === null ? null : await repositories.sequences.getItem(itemId)

      if (item) {
        setOriginal(item)
        setDraft(draftFromItem(item))

        return
      }

      if (sequenceId !== null) {
        setDraft(emptyItemDraft(sequenceId))
      }
    }

    load()
  }, [repositories, itemId, sequenceId])

  function update(patch: Partial<SequenceItemDraft>): void {
    setDraft((current) => current && { ...current, ...patch })
  }

  async function save(): Promise<void> {
    if (!draft) {
      return
    }

    setIsSaving(true)

    try {
      await saveSequenceItem(repositories.sequences, draft, original)

      router.back()
    } catch {
      setIsSaving(false)

      Alert.alert(strings.error.message)
    }
  }

  function confirmRemove(): void {
    Alert.alert(strings.sequenceItem.removeConfirm, undefined, [
      {
        text: strings.common.cancel,
        style: 'cancel',
      },
      {
        text: strings.sequenceItem.remove,
        style: 'destructive',
        onPress: remove,
      },
    ])
  }

  async function remove(): Promise<void> {
    if (!original) {
      return
    }

    await repositories.sequences.deleteItem(original.id)

    router.back()
  }

  if (!draft) {
    return null
  }

  const isComplete = isItemDraftComplete(draft)
  const sequenceTitle = sequences.find((sequence) => sequence.id === draft.sequenceId)?.title

  return (
    <ParentScreen
      accessory={
        sequenceTitle === undefined ? undefined : (
          <Text numberOfLines={1} style={styles.sequenceLabel}>
            {sequenceTitle}
          </Text>
        )
      }
      title={original ? strings.sequenceItem.editTitle : strings.sequenceItem.newTitle}
    >
      <View style={styles.field}>
        <SectionLabel title={strings.sequenceItem.word} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(text) => update({ text })}
          placeholder={strings.sequenceItem.wordPlaceholder}
          placeholderTextColor={color.hint}
          returnKeyType="done"
          spellCheck={false}
          style={[styles.word, fontForText(draft.text, font.bold)]}
          value={draft.text}
        />
        <Text style={typography.body}>{strings.sequenceItem.wordHint}</Text>
      </View>
      <View style={styles.field}>
        <SectionLabel title={strings.sequenceItem.symbol} />
        <TextInput
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={1}
          onChangeText={(symbol) => update({ symbol })}
          placeholder={strings.sequenceItem.symbolPlaceholder}
          placeholderTextColor={color.hint}
          returnKeyType="done"
          style={[styles.symbol, fontForText(draft.symbol, font.extraBold)]}
          value={draft.symbol}
        />
        <Text style={typography.body}>{strings.sequenceItem.symbolHint}</Text>
      </View>
      <VoiceField
        audio={draft.audio}
        levels={null}
        onRecorded={(uri) =>
          update({
            audio: {
              kind: 'captured',
              uri,
            },
          })
        }
      />
      <PhotoField image={draft.image} onChange={(image) => update({ image })} />
      {sequences.length > 1 && (
        <Panel>
          <SectionLabel title={strings.sequenceItem.sequence} />
          <ChipGroup
            label={(id) => sequences.find((sequence) => sequence.id === id)?.title ?? ''}
            onChange={(id) => update({ sequenceId: id })}
            options={sequences.map((sequence) => sequence.id)}
            value={draft.sequenceId}
          />
        </Panel>
      )}
      <View style={styles.field}>
        <ParentButton disabled={!isComplete || isSaving} onPress={save} title={strings.cardEditor.save} variant="primary" />
        {!isComplete && <Text style={[typography.body, styles.centered]}>{strings.sequenceItem.incomplete}</Text>}
        {original && <ParentButton onPress={confirmRemove} title={strings.sequenceItem.remove} variant="danger" />}
      </View>
    </ParentScreen>
  )
}

const styles = StyleSheet.create({
  field: {
    gap: space.sm,
  },
  sequenceLabel: {
    ...typography.row,
    flexShrink: 1,
    maxWidth: '45%',
    color: color.muted,
    fontFamily: font.medium,
  },
  word: {
    height: WORD_HEIGHT,
    paddingHorizontal: space.parentPad,
    borderWidth: 1,
    borderColor: color.cardLine,
    borderRadius: radius.button,
    backgroundColor: color.card,
    color: color.ink,
    fontSize: 26,
  },
  symbol: {
    width: SYMBOL_SIZE,
    height: SYMBOL_SIZE,
    borderWidth: 1,
    borderColor: color.cardLine,
    borderRadius: radius.button,
    backgroundColor: color.card,
    color: color.ink,
    fontSize: 32,
    textAlign: 'center',
  },
  centered: {
    textAlign: 'center',
  },
})
