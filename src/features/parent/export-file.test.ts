import { describe, expect, test } from '@jest/globals'
import type { EventRow } from '@/db'
import { eventsCsv, exportFileName } from '@/features/parent/export-file'

function event(overrides: Partial<EventRow>): EventRow {
  return {
    id: 1,
    session_id: null,
    ts: Date.UTC(2026, 8, 23, 7, 42),
    type: 'request_tap',
    card_id: null,
    sequence_id: null,
    item_position: null,
    payload_json: null,
    ...overrides,
  }
}

describe('eventsCsv', () => {
  test('writes a header and one line per event, with the time in both forms', () => {
    const csv = eventsCsv([event({ id: 1, session_id: 3, card_id: 7 })])

    expect(csv.split('\n')).toEqual([
      'id,ts,time,type,session_id,card_id,sequence_id,item_position,payload',
      `1,${Date.UTC(2026, 8, 23, 7, 42)},2026-09-23T07:42:00.000Z,request_tap,3,7,,,`,
    ])
  })

  test('quotes a payload that carries commas or quotes', () => {
    const csv = eventsCsv([event({ payload_json: '{"reason":"repeat","word":"a,b"}' })])

    expect(csv.split('\n')[1]).toContain('"{""reason"":""repeat"",""word"":""a,b""}"')
  })
})

describe('exportFileName', () => {
  test('carries the day it was made', () => {
    expect(exportFileName(new Date(2026, 8, 3, 12, 0).getTime())).toBe('birga-2026-09-03.zip')
  })
})
