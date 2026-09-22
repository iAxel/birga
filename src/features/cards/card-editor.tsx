import { useRouter } from 'expo-router'
import { type ReactElement, useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { type Board, type Card, useRepositories } from '@/db'
import { BoardField } from '@/features/cards/board-field'
import { type CardDraft, draftFromCard, emptyDraft, isDraftComplete, saveCard } from '@/features/cards/card-draft'
import { PhotoField } from '@/features/cards/photo-field'
import { VoiceField } from '@/features/cards/voice-field'
import { strings } from '@/i18n'
import { ParentButton } from '@/ui/parent-button'
import { color, radius, space, touch, typography } from '@/ui/theme'

interface CardEditorProps {
  cardId: number | null
  boardId: number | null
}

/** Creates a card on a board or edits one (SPEC §5): optional photo, the word as typed, the parent's voice, the board. */
export function CardEditor({ cardId, boardId }: CardEditorProps): ReactElement | null {
  const router = useRouter()
  const repositories = useRepositories()
  const [boards, setBoards] = useState<Board[]>([])
  const [original, setOriginal] = useState<Card | null>(null)
  const [draft, setDraft] = useState<CardDraft | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function load(): Promise<void> {
      setBoards(await repositories.boards.list())

      const card = cardId === null ? null : await repositories.cards.get(cardId)

      if (card) {
        setOriginal(card)
        setDraft(draftFromCard(card))

        return
      }

      if (boardId !== null) {
        setDraft(emptyDraft(boardId))
      }
    }

    load()
  }, [repositories, cardId, boardId])

  function update(patch: Partial<CardDraft>): void {
    setDraft((current) => current && { ...current, ...patch })
  }

  async function save(): Promise<void> {
    if (!draft) {
      return
    }

    setIsSaving(true)

    try {
      await saveCard(repositories.cards, draft, original)

      router.back()
    } catch {
      setIsSaving(false)

      Alert.alert(strings.error.message)
    }
  }

  function confirmArchive(): void {
    Alert.alert(strings.cardEditor.archiveConfirm, undefined, [
      {
        text: strings.common.cancel,
        style: 'cancel',
      },
      {
        text: strings.cardEditor.archive,
        style: 'destructive',
        onPress: archive,
      },
    ])
  }

  async function archive(): Promise<void> {
    if (!original) {
      return
    }

    await repositories.cards.archive(original.id)

    router.back()
  }

  if (!draft) {
    return null
  }

  const isComplete = isDraftComplete(draft)

  return (
    <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <PhotoField image={draft.image} onChange={(image) => update({ image })} />
      <View style={styles.field}>
        <Text style={typography.body}>{strings.cardEditor.word}</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(text) => update({ text })}
          placeholder={strings.cardEditor.wordPlaceholder}
          placeholderTextColor={color.hint}
          returnKeyType="done"
          spellCheck={false}
          style={styles.word}
          value={draft.text}
        />
      </View>
      <VoiceField
        audio={draft.audio}
        onRecorded={(uri) =>
          update({
            audio: {
              kind: 'captured',
              uri,
            },
          })
        }
      />
      <BoardField boardId={draft.boardId} boards={boards} onChange={(id) => update({ boardId: id })} />
      <ParentButton disabled={!isComplete || isSaving} onPress={save} title={strings.cardEditor.save} variant="primary" />
      {!isComplete && <Text style={typography.body}>{strings.cardEditor.incomplete}</Text>}
      {original && <ParentButton onPress={confirmArchive} title={strings.cardEditor.archive} />}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: space.lg,
    padding: space.md,
  },
  field: {
    gap: space.sm,
  },
  word: {
    minHeight: touch.parent,
    paddingHorizontal: space.md,
    borderRadius: radius.button,
    backgroundColor: color.card,
    color: color.ink,
    fontSize: 28,
    fontWeight: '600',
  },
})
