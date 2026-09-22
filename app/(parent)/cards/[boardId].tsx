import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { type ReactElement, useCallback, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text } from 'react-native'
import { type Board, type Card, useRepositories } from '@/db'
import { CardRow } from '@/features/cards/card-row'
import { strings } from '@/i18n'
import { ParentButton } from '@/ui/parent-button'
import { parseIdParam } from '@/ui/route-params'
import { spacing, typography } from '@/ui/theme'

/** One board: its cards in the fixed order the child sees, whether it is the active board, adding and ordering cards. */
export default function BoardScreen(): ReactElement | null {
  const params = useLocalSearchParams<{ boardId: string }>()
  const boardId = parseIdParam(params.boardId)
  const router = useRouter()
  const repositories = useRepositories()
  const [board, setBoard] = useState<Board | null>(null)
  const [cards, setCards] = useState<Card[]>([])

  const reload = useCallback(async (): Promise<void> => {
    if (boardId === null) {
      return
    }

    setBoard(await repositories.boards.get(boardId))
    setCards(await repositories.cards.listByBoard(boardId))
  }, [repositories, boardId])

  useFocusEffect(
    useCallback(() => {
      reload()
    }, [reload]),
  )

  async function moveCard(cardId: number, offset: -1 | 1): Promise<void> {
    await repositories.cards.move(cardId, offset)

    await reload()
  }

  async function activate(): Promise<void> {
    if (!board) {
      return
    }

    await repositories.boards.activate(board.id)

    await reload()
  }

  function askForTitle(): void {
    if (!board) {
      return
    }

    Alert.prompt(strings.boards.namePrompt, undefined, rename, 'plain-text', board.title)
  }

  async function rename(title: string): Promise<void> {
    if (!board || !title.trim()) {
      return
    }

    await repositories.boards.rename(board.id, title)

    await reload()
  }

  function openCard(cardId: number): void {
    router.push({
      pathname: '/card/[cardId]',
      params: {
        cardId,
      },
    })
  }

  function addCard(): void {
    if (!board) {
      return
    }

    router.push({
      pathname: '/card/new',
      params: {
        boardId: board.id,
      },
    })
  }

  if (!board) {
    return null
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: board.title,
        }}
      />
      {board.isActive ? (
        <Text style={typography.caption}>{strings.boards.activeHint}</Text>
      ) : (
        <ParentButton onPress={activate} title={strings.boards.activate} />
      )}
      {cards.length === 0 && <Text style={typography.caption}>{strings.cards.starterHint}</Text>}
      {cards.map((card, index) => (
        <CardRow
          canMoveDown={index < cards.length - 1}
          canMoveUp={index > 0}
          card={card}
          key={card.id}
          onMove={(offset) => moveCard(card.id, offset)}
          onOpen={() => openCard(card.id)}
          position={index + 1}
        />
      ))}
      <ParentButton onPress={addCard} title={strings.cards.add} variant="primary" />
      <ParentButton onPress={askForTitle} title={strings.boards.rename} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    padding: spacing.md,
  },
})
