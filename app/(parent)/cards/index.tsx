import { useRouter } from 'expo-router'
import { type ReactElement, useCallback } from 'react'
import { Alert, Text } from 'react-native'
import { useRepositories } from '@/db'
import { useFocusQuery } from '@/db/use-focus-query'
import { strings } from '@/i18n'
import { ListRow, Panel } from '@/ui/panel'
import { ParentButton } from '@/ui/parent-button'
import { ParentScreen } from '@/ui/parent-screen'
import { typography } from '@/ui/theme'

/** The boards, with the one the child sees marked. With no boards yet, creating one is the only thing to do. */
export default function BoardsScreen(): ReactElement | null {
  const router = useRouter()
  const { boards: boardsRepository } = useRepositories()
  const boards = useFocusQuery(useCallback(() => boardsRepository.list(), [boardsRepository]))

  function askForTitle(): void {
    Alert.prompt(strings.boards.namePrompt, undefined, createBoard)
  }

  async function createBoard(title: string): Promise<void> {
    if (!title.trim()) {
      return
    }

    const boardId = await boardsRepository.create(title)

    openBoard(boardId)
  }

  function openBoard(boardId: number): void {
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
    <ParentScreen
      footer={<ParentButton icon="plus" onPress={askForTitle} title={strings.boards.add} variant="primary" />}
      title={strings.boards.title}
    >
      {boards.length === 0 ? (
        <Panel>
          <Text style={typography.body}>{strings.boards.empty}</Text>
        </Panel>
      ) : (
        <Panel hasRows>
          {boards.map((board, index) => (
            <ListRow
              hasSeparator={index < boards.length - 1}
              key={board.id}
              onPress={() => openBoard(board.id)}
              title={board.title}
              value={board.isActive ? strings.boards.active : undefined}
            />
          ))}
        </Panel>
      )}
    </ParentScreen>
  )
}
