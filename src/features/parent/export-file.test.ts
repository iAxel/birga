import { describe, expect, test } from '@jest/globals'
import type { EventRow } from '@/db'
import { eventsCsv, exportFileName, localTimestamp } from '@/features/parent/export-file'

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
    const ts = Date.UTC(2026, 8, 23, 7, 42)
    const csv = eventsCsv([event({ id: 1, session_id: 3, card_id: 7 })])

    expect(csv.split('\n')).toEqual([
      'id,ts,time,type,session_id,card_id,sequence_id,item_position,payload',
      `1,${ts},${localTimestamp(ts)},request_tap,3,7,,,`,
    ])
  })

  test('quotes a payload that carries commas or quotes', () => {
    const csv = eventsCsv([event({ payload_json: '{"reason":"repeat","word":"a,b"}' })])

    expect(csv.split('\n')[1]).toContain('"{""reason"":""repeat"",""word"":""a,b""}"')
  })
})

describe('localTimestamp', () => {
  test("writes the time as the family's clock showed it, with the offset", () => {
    expect(localTimestamp(Date.UTC(2026, 8, 22, 22, 30), 300)).toBe('2026-09-23T03:30:00+05:00')
    expect(localTimestamp(Date.UTC(2026, 8, 23, 7, 42), 0)).toBe('2026-09-23T07:42:00+00:00')
    expect(localTimestamp(Date.UTC(2026, 0, 1, 2, 0), -300)).toBe('2025-12-31T21:00:00-05:00')
    expect(localTimestamp(Date.UTC(2026, 0, 1, 2, 0), 330)).toBe('2026-01-01T07:30:00+05:30')
  })
})

describe('exportFileName', () => {
  test('carries the day it was made', () => {
    expect(exportFileName(new Date(2026, 8, 3, 12, 0).getTime())).toBe('birga-2026-09-03.zip')
  })
})
