import { useLocalSearchParams } from 'expo-router'
import type { ReactElement } from 'react'
import { CardEditor } from '@/features/cards/card-editor'
import { parseIdParam } from '@/ui/route-params'

/** A new card, added at the end of the board it was opened from. */
export default function NewCardScreen(): ReactElement {
  const params = useLocalSearchParams<{ boardId: string }>()

  return <CardEditor boardId={parseIdParam(params.boardId)} cardId={null} />
}
