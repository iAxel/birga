import { useRouter } from 'expo-router'
import { type ReactElement, useEffect, useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native'
import { type Board, type Card, useRepositories } from '@/db'
import { BoardField } from '@/features/cards/board-field'
import { type CardDraft, draftFromCard, emptyDraft, isDraftComplete, saveCard } from '@/features/cards/card-draft'
import { PhotoField } from '@/features/cards/photo-field'
import { VoiceField } from '@/features/cards/voice-field'
import { strings } from '@/i18n'
import { alertOnFailure } from '@/ui/alert-on-failure'
import { fontForText } from '@/ui/fonts'
import { SectionLabel } from '@/ui/panel'
import { ParentButton } from '@/ui/parent-button'
import { ParentScreen } from '@/ui/parent-screen'
import { color, font, radius, space, typography } from '@/ui/theme'

const WORD_HEIGHT = 56

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
  /** The card, or the board for a new one, is not there: a link to a card archived meanwhile, or a read that failed. */
  const [isMissing, setIsMissing] = useState(false)

  useEffect(() => {
    async function load(): Promise<void> {
      setBoards(await repositories.boards.list())

      const card = cardId === null ? null : await repositories.cards.get(cardId)

      if (card) {
        setOriginal(card)
        setDraft(draftFromCard(card))

        return
      }

      if (cardId === null && boardId !== null) {
        setDraft(emptyDraft(boardId))

        return
      }

      setIsMissing(true)
    }

    load().catch(() => setIsMissing(true))
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
        onPress: () => alertOnFailure(archive),
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

  if (isMissing) {
    return (
      <ParentScreen title={strings.cardEditor.editTitle}>
        <Text style={typography.body}>{strings.common.missing}</Text>
      </ParentScreen>
    )
  }

  if (!draft) {
    return null
  }

  const isComplete = isDraftComplete(draft)
  const boardTitle = boards.find((board) => board.id === draft.boardId)?.title

  return (
    <ParentScreen
      accessory={
        boardTitle !== undefined && (
          <Text numberOfLines={1} style={styles.boardLabel}>
            {strings.cardEditor.boardLabel(boardTitle)}
          </Text>
        )
      }
      title={original ? strings.cardEditor.editTitle : strings.cardEditor.newTitle}
    >
      <PhotoField image={draft.image} onChange={(image) => update({ image })} />
      <View style={styles.field}>
        <SectionLabel title={strings.cardEditor.word} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(text) => update({ text })}
          placeholder={strings.cardEditor.wordPlaceholder}
          placeholderTextColor={color.hint}
          returnKeyType="done"
          spellCheck={false}
          style={[styles.word, fontForText(draft.text, font.bold)]}
          value={draft.text}
        />
        <Text style={typography.body}>{strings.cardEditor.wordHint}</Text>
      </View>
      <VoiceField
        audio={draft.audio}
        levels={draft.audioLevels}
        onRecorded={(uri, audioLevels) =>
          update({
            audio: {
              kind: 'captured',
              uri,
            },
            audioLevels,
          })
        }
      />
      <BoardField boardId={draft.boardId} boards={boards} onChange={(id) => update({ boardId: id })} />
      <View style={styles.field}>
        <ParentButton disabled={!isComplete || isSaving} onPress={save} title={strings.cardEditor.save} variant="primary" />
        {!isComplete && <Text style={[typography.body, styles.centered]}>{strings.cardEditor.incomplete}</Text>}
        {original && <ParentButton onPress={confirmArchive} title={strings.cardEditor.archive} variant="danger" />}
      </View>
    </ParentScreen>
  )
}

const styles = StyleSheet.create({
  field: {
    gap: space.sm,
  },
  boardLabel: {
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
  centered: {
    textAlign: 'center',
  },
})
