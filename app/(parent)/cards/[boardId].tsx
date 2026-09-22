import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { type ReactElement, useCallback, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { type Board, type Card, useRepositories } from '@/db'
import { CardRow } from '@/features/cards/card-row'
import { cardsOnScreen } from '@/features/requests/board-layout'
import { useSettings } from '@/features/settings/settings-provider'
import { strings } from '@/i18n'
import { useFormFactor } from '@/ui/form-factor'
import { Badge, Panel } from '@/ui/panel'
import { ParentButton } from '@/ui/parent-button'
import { ParentScreen } from '@/ui/parent-screen'
import { parseIdParam } from '@/ui/route-params'
import { color, space, typography } from '@/ui/theme'

/**
 * One board: its cards in the fixed order the child sees, whether it is the active board, adding and ordering cards.
 * When the board has more cards than fit on the child's screen, a line marks where the visible ones end; this device's
 * screen decides how many fit.
 */
export default function BoardScreen(): ReactElement | null {
  const params = useLocalSearchParams<{ boardId: string }>()
  const boardId = parseIdParam(params.boardId)
  const router = useRouter()
  const repositories = useRepositories()
  const settings = useSettings()
  const formFactor = useFormFactor()
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

  const visibleCount = cardsOnScreen(settings.cardsPerScreen, formFactor)
  const visibleCards = cards.slice(0, visibleCount)
  const hiddenCards = cards.slice(visibleCount)

  function renderRows(rows: Card[], offset: number): ReactElement[] {
    return rows.map((card, index) => (
      <CardRow
        canMoveDown={offset + index < cards.length - 1}
        canMoveUp={offset + index > 0}
        card={card}
        hasSeparator={index < rows.length - 1}
        key={card.id}
        onMove={(move) => moveCard(card.id, move)}
        onOpen={() => openCard(card.id)}
      />
    ))
  }

  return (
    <ParentScreen
      accessory={board.isActive && <Badge title={strings.boards.active} />}
      footer={<ParentButton icon="plus" onPress={addCard} title={strings.cards.add} variant="primary" />}
      title={board.title}
    >
      {!board.isActive && <ParentButton onPress={activate} title={strings.boards.activate} variant="secondary" />}
      {cards.length === 0 ? (
        <Panel>
          <Text style={typography.body}>{strings.cards.starterHint}</Text>
        </Panel>
      ) : (
        <Text style={typography.body}>{strings.cards.visibleHint(visibleCount)}</Text>
      )}
      {visibleCards.length > 0 && <Panel hasRows>{renderRows(visibleCards, 0)}</Panel>}
      {hiddenCards.length > 0 && (
        <>
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={typography.body}>{strings.cards.hiddenDivider}</Text>
            <View style={styles.line} />
          </View>
          <Panel hasRows style={styles.hidden}>
            {renderRows(hiddenCards, visibleCount)}
          </Panel>
        </>
      )}
      <ParentButton onPress={askForTitle} title={strings.boards.rename} />
    </ParentScreen>
  )
}

const styles = StyleSheet.create({
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: color.hint,
  },
  hidden: {
    opacity: 0.6,
  },
})
