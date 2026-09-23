import { useLocalSearchParams } from 'expo-router'
import type { ReactElement } from 'react'
import { SequenceItemEditor } from '@/features/sequences/sequence-item-editor'
import { parseIdParam } from '@/ui/route-params'

/** A new item, added at the end of the sequence it was opened from. */
export default function NewSequenceItemScreen(): ReactElement {
  const params = useLocalSearchParams<{ sequenceId: string }>()

  return <SequenceItemEditor itemId={null} sequenceId={parseIdParam(params.sequenceId)} />
}
