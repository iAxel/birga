import type { CardsPerScreen } from '@/db'
import type { FormFactor } from '@/ui/form-factor'

export interface Size {
  width: number
  height: number
}

export interface Rect extends Size {
  x: number
  y: number
}

export interface GridShape {
  columns: number
  rows: number
}

export interface Enlargement {
  /** Where the enlarged card is drawn: centred, at its full size. */
  target: Rect
  /** The transform that shrinks the enlarged card back onto its slot; animating it to identity enlarges the card. */
  fromSlot: {
    translateX: number
    translateY: number
    scale: number
  }
}

const PORTRAIT_SHAPES: Record<CardsPerScreen, GridShape> = {
  2: {
    columns: 1,
    rows: 2,
  },
  4: {
    columns: 2,
    rows: 2,
  },
  6: {
    columns: 2,
    rows: 3,
  },
}

/** How many cards the child sees: the setting on a tablet; a phone shows two stacked cards in v0.1 (SPEC §2). */
export function cardsOnScreen(cardsPerScreen: CardsPerScreen, formFactor: FormFactor): CardsPerScreen {
  if (formFactor === 'phone') {
    return 2
  }

  return cardsPerScreen
}

/** Portrait stacks cards vertically; a landscape screen (an iPad on the table) turns the same grid sideways. */
export function gridShape(cardsPerScreen: CardsPerScreen, area: Size): GridShape {
  const portrait = PORTRAIT_SHAPES[cardsPerScreen]

  if (area.width <= area.height) {
    return portrait
  }

  return {
    columns: portrait.rows,
    rows: portrait.columns,
  }
}

/** Slot rectangles in reading order, the same size each, with `gap` between them and around the edge. */
export function layoutGrid(area: Size, shape: GridShape, gap: number): Rect[] {
  const width = (area.width - gap * (shape.columns + 1)) / shape.columns
  const height = (area.height - gap * (shape.rows + 1)) / shape.rows
  const slots: Rect[] = []

  for (let row = 0; row < shape.rows; row++) {
    for (let column = 0; column < shape.columns; column++) {
      slots.push({
        x: gap + column * (width + gap),
        y: gap + row * (height + gap),
        width,
        height,
      })
    }
  }

  return slots
}

/** The enlarged card keeps the slot's proportions, fills `fill` of the area at most, and is never smaller than its slot. */
export function enlargement(slot: Rect, area: Size, fill: number): Enlargement {
  const scale = Math.max(1, Math.min((area.width * fill) / slot.width, (area.height * fill) / slot.height))
  const width = slot.width * scale
  const height = slot.height * scale

  return {
    target: {
      x: (area.width - width) / 2,
      y: (area.height - height) / 2,
      width,
      height,
    },
    fromSlot: {
      translateX: slot.x + slot.width / 2 - area.width / 2,
      translateY: slot.y + slot.height / 2 - area.height / 2,
      scale: 1 / scale,
    },
  }
}
