import { describe, expect, test } from '@jest/globals'
import { cardsOnScreen, enlargement, gridShape, layoutGrid } from '@/features/requests/board-layout'

const PHONE = {
  width: 400,
  height: 700,
}

describe('cardsOnScreen', () => {
  test('follows the setting on a tablet and shows two cards on a phone', () => {
    expect(cardsOnScreen(6, 'tablet')).toBe(6)
    expect(cardsOnScreen(2, 'tablet')).toBe(2)
    expect(cardsOnScreen(4, 'phone')).toBe(2)
    expect(cardsOnScreen(6, 'phone')).toBe(2)
  })
})

describe('gridShape', () => {
  test('stacks two cards and puts four or six in two columns on a portrait screen', () => {
    expect(gridShape(2, PHONE)).toEqual({
      columns: 1,
      rows: 2,
    })
    expect(gridShape(4, PHONE)).toEqual({
      columns: 2,
      rows: 2,
    })
    expect(gridShape(6, PHONE)).toEqual({
      columns: 2,
      rows: 3,
    })
  })

  test('turns the grid sideways on a landscape screen', () => {
    expect(
      gridShape(6, {
        width: 1000,
        height: 700,
      }),
    ).toEqual({
      columns: 3,
      rows: 2,
    })
  })
})

describe('layoutGrid', () => {
  test('lays out equal slots in reading order with gaps around and between them', () => {
    const slots = layoutGrid(
      PHONE,
      {
        columns: 2,
        rows: 2,
      },
      20,
    )

    expect(slots).toEqual([
      {
        x: 20,
        y: 20,
        width: 170,
        height: 320,
      },
      {
        x: 210,
        y: 20,
        width: 170,
        height: 320,
      },
      {
        x: 20,
        y: 360,
        width: 170,
        height: 320,
      },
      {
        x: 210,
        y: 360,
        width: 170,
        height: 320,
      },
    ])
  })
})

describe('enlargement', () => {
  test('centres the card at the largest size that fits and maps it back onto its slot', () => {
    const slot = {
      x: 20,
      y: 20,
      width: 170,
      height: 320,
    }

    const { target, fromSlot } = enlargement(slot, PHONE, 0.9)

    expect(target.height).toBeCloseTo(PHONE.height * 0.9)
    expect(target.width).toBeLessThanOrEqual(PHONE.width * 0.9)
    expect(target.x + target.width / 2).toBeCloseTo(PHONE.width / 2)
    expect(target.y + target.height / 2).toBeCloseTo(PHONE.height / 2)
    expect(target.width / target.height).toBeCloseTo(slot.width / slot.height)
    expect(fromSlot.scale).toBeCloseTo(slot.width / target.width)
    expect(fromSlot.translateX).toBeCloseTo(105 - 200)
    expect(fromSlot.translateY).toBeCloseTo(180 - 350)
  })

  test('never shrinks a slot that is already large', () => {
    const { fromSlot } = enlargement(
      {
        x: 0,
        y: 0,
        width: 400,
        height: 350,
      },
      PHONE,
      0.9,
    )

    expect(fromSlot.scale).toBe(1)
  })
})
