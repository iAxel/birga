import { describe, expect, test } from '@jest/globals'
import { decideTap, type TapContext } from '@/features/requests/request-gate'

const DEBOUNCE_MS = 8000

function childTap(overrides: Partial<TapContext>): TapContext {
  return {
    cardId: 1,
    word: 'suv',
    now: 100_000,
    isBoardBusy: false,
    isModeling: false,
    lastPlayedAt: undefined,
    debounceMs: DEBOUNCE_MS,
    ...overrides,
  }
}

describe('decideTap', () => {
  test('plays a card the child has not played recently', () => {
    expect(decideTap(childTap({}))).toEqual({
      play: true,
      event: {
        type: 'request_tap',
        cardId: 1,
        payload: {
          word: 'suv',
        },
      },
    })
  })

  test('keeps the same card silent until the debounce time has passed', () => {
    const repeated = decideTap(childTap({ lastPlayedAt: 100_000 - DEBOUNCE_MS + 1 }))
    const afterPause = decideTap(childTap({ lastPlayedAt: 100_000 - DEBOUNCE_MS }))

    expect(repeated).toEqual({
      play: false,
      event: {
        type: 'request_tap_debounced',
        cardId: 1,
        payload: {
          reason: 'repeat',
          word: 'suv',
        },
      },
    })
    expect(afterPause.play).toBe(true)
  })

  test('ignores every card while another request is on screen', () => {
    expect(decideTap(childTap({ cardId: 2, isBoardBusy: true }))).toEqual({
      play: false,
      event: {
        type: 'request_tap_debounced',
        cardId: 2,
        payload: {
          reason: 'busy',
          word: 'suv',
        },
      },
    })
  })

  test('plays parent taps as modelling, without the debounce', () => {
    expect(decideTap(childTap({ isModeling: true, lastPlayedAt: 99_999 }))).toEqual({
      play: true,
      event: {
        type: 'request_tap_model',
        cardId: 1,
        payload: {
          word: 'suv',
        },
      },
    })
  })

  test('does not log parent taps that the board ignores', () => {
    expect(decideTap(childTap({ isModeling: true, isBoardBusy: true }))).toEqual({
      play: false,
      event: null,
    })
  })
})
