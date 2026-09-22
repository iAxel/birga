import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { Fragment, type ReactElement, useCallback, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text } from 'react-native'
import { type Board, type Card, useRepositories } from '@/db'
import { CardRow } from '@/features/cards/card-row'
import { useSettings } from '@/features/settings/settings-provider'
import { strings } from '@/i18n'
import { ParentButton } from '@/ui/parent-button'
import { parseIdParam } from '@/ui/route-params'
import { space, typography } from '@/ui/theme'

/**
 * One board: its cards in the fixed order the child sees, whether it is the active board, adding and ordering cards.
 * When the board has more cards than fit on the child's screen, a line marks where the visible ones end.
 */
export default function BoardScreen(): ReactElement | null {
  const params = useLocalSearchParams<{ boardId: string }>()
  const boardId = parseIdParam(params.boardId)
  const router = useRouter()
  const repositories = useRepositories()
  const settings = useSettings()
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
        <Text style={typography.body}>{strings.boards.activeHint}</Text>
      ) : (
        <ParentButton onPress={activate} title={strings.boards.activate} />
      )}
      {cards.length === 0 && <Text style={typography.body}>{strings.cards.starterHint}</Text>}
      {cards.map((card, index) => (
        <Fragment key={card.id}>
          <CardRow
            canMoveDown={index < cards.length - 1}
            canMoveUp={index > 0}
            card={card}
            onMove={(offset) => moveCard(card.id, offset)}
            onOpen={() => openCard(card.id)}
            position={index + 1}
          />
          {index === settings.cardsPerScreen - 1 && cards.length > settings.cardsPerScreen && (
            <Text style={[typography.body, styles.limit]}>{strings.cards.visibleLimit(settings.cardsPerScreen)}</Text>
          )}
        </Fragment>
      ))}
      <ParentButton onPress={addCard} title={strings.cards.add} variant="primary" />
      <ParentButton onPress={askForTitle} title={strings.boards.rename} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: space.sm,
    padding: space.md,
  },
  limit: {
    paddingVertical: space.sm,
    textAlign: 'center',
  },
})
