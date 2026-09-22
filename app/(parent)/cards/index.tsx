import { Link, useFocusEffect, useRouter } from 'expo-router'
import { type ReactElement, useCallback, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import { type Board, useRepositories } from '@/db'
import { strings } from '@/i18n'
import { ParentButton } from '@/ui/parent-button'
import { color, radius, space, touch, typography } from '@/ui/theme'

/** The boards, with the one the child sees marked. With no boards yet, creating one is the only thing to do. */
export default function BoardsScreen(): ReactElement | null {
  const router = useRouter()
  const { boards: boardsRepository } = useRepositories()
  const [boards, setBoards] = useState<Board[] | null>(null)

  useFocusEffect(
    useCallback(() => {
      boardsRepository.list().then(setBoards)
    }, [boardsRepository]),
  )

  function askForTitle(): void {
    Alert.prompt(strings.boards.namePrompt, undefined, createBoard)
  }

  async function createBoard(title: string): Promise<void> {
    if (!title.trim()) {
      return
    }

    const boardId = await boardsRepository.create(title)

    router.push({
      pathname: '/cards/[boardId]',
      params: {
        boardId,
      },
    })
  }

  if (!boards) {
    return null
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {boards.length === 0 && <Text style={typography.body}>{strings.boards.empty}</Text>}
      {boards.map((board) => (
        <Link
          asChild
          href={{
            pathname: '/cards/[boardId]',
            params: {
              boardId: board.id,
            },
          }}
          key={board.id}
        >
          <Pressable style={styles.row}>
            <Text style={typography.row}>{board.title}</Text>
            {board.isActive && <Text style={[typography.body, styles.active]}>{strings.boards.active}</Text>}
          </Pressable>
        </Link>
      ))}
      <ParentButton onPress={askForTitle} title={strings.boards.add} variant="primary" />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: space.sm,
    padding: space.md,
  },
  row: {
    minHeight: touch.parent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.button,
    backgroundColor: color.card,
  },
  active: {
    color: color.accent,
    fontWeight: '600',
  },
})
