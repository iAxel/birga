import type { ReactElement } from 'react'
import type { Board } from '@/db'
import { strings } from '@/i18n'
import { ChipGroup } from '@/ui/chips'
import { Panel, SectionLabel } from '@/ui/panel'

interface BoardFieldProps {
  boards: Board[]
  boardId: number
  onChange: (boardId: number) => void
}

/** The board the card belongs to; not shown while there is only one board. */
export function BoardField({ boards, boardId, onChange }: BoardFieldProps): ReactElement | null {
  if (boards.length < 2) {
    return null
  }

  return (
    <Panel>
      <SectionLabel title={strings.cardEditor.board} />
      <ChipGroup
        label={(id) => boards.find((board) => board.id === id)?.title ?? ''}
        onChange={onChange}
        options={boards.map((board) => board.id)}
        value={boardId}
      />
    </Panel>
  )
}
