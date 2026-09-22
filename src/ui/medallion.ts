/**
 * The suzani-style medallion of DESIGN §2 (Ornament) as one SVG: concentric rings, 8 petals, 16 dots and 8 leaves, stroke
 * only. The ornaments, the app icon and the splash screen are all drawn from it. No imports, so a Node script can use
 * it too.
 */

/** Side of the square view box; every length below is a share of the outer radius. */
const VIEW = 1000

const CENTER = VIEW / 2

const OUTER = 490

const RINGS = [1, 0.57, 0.12]

const DOTTED_RING = 0.845

const PETAL = {
  center: 0.32,
  along: 0.22,
  across: 0.125,
}

const LEAF = {
  from: 0.585,
  to: 0.815,
  halfWidth: 0.055,
}

const DOT = {
  at: 0.7,
  radius: 0.012,
}

export interface MedallionLook {
  stroke: string
  /** Stroke width in view-box units: the view box is 1000 wide, whatever size the medallion is drawn at. */
  strokeWidth: number
}

/** Stroke width in view-box units that looks `points` wide when the medallion is drawn `size` points wide. */
export function medallionStroke(points: number, size: number): number {
  return (points * VIEW) / size
}

export function medallionSvg({ stroke, strokeWidth }: MedallionLook): string {
  const shapes: string[] = []

  for (const ring of RINGS) {
    shapes.push(`<circle cx="${CENTER}" cy="${CENTER}" r="${format(ring * OUTER)}"/>`)
  }

  shapes.push(
    `<circle cx="${CENTER}" cy="${CENTER}" r="${format(DOTTED_RING * OUTER)}" stroke-dasharray="0.1 ${format(strokeWidth * 6)}" stroke-linecap="round" stroke-width="${format(strokeWidth * 1.4)}"/>`,
  )

  for (let index = 0; index < 8; index++) {
    shapes.push(petal(index * 45))
    shapes.push(leaf(22.5 + index * 45))
  }

  for (let index = 0; index < 16; index++) {
    const [x, y] = polar(DOT.at, index * 22.5)

    shapes.push(`<circle cx="${format(x)}" cy="${format(y)}" r="${format(DOT.radius * OUTER)}"/>`)
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}">`,
    `<g fill="none" stroke="${stroke}" stroke-width="${format(strokeWidth)}">`,
    ...shapes,
    '</g>',
    '</svg>',
  ].join('')
}

/**
 * An ellipse along the radius at `angle` degrees, as two arcs between its tips, so no transform attribute is needed. The
 * arcs' x axis is turned by `angle`, which makes it run across the radius.
 */
function petal(angle: number): string {
  const [x1, y1] = polar(PETAL.center - PETAL.along, angle)
  const [x2, y2] = polar(PETAL.center + PETAL.along, angle)
  const rx = format(PETAL.across * OUTER)
  const ry = format(PETAL.along * OUTER)

  return `<path d="M${format(x1)} ${format(y1)}A${rx} ${ry} ${angle} 1 0 ${format(x2)} ${format(y2)}A${rx} ${ry} ${angle} 1 0 ${format(x1)} ${format(y1)}Z"/>`
}

/** A pointed leaf along the radius at `angle` degrees: two quadratic curves meeting at both tips. */
function leaf(angle: number): string {
  const [x1, y1] = polar(LEAF.from, angle)
  const [x2, y2] = polar(LEAF.to, angle)
  const middle = (LEAF.from + LEAF.to) / 2
  const [cx1, cy1] = offset(polar(middle, angle), angle + 90, LEAF.halfWidth * 2)
  const [cx2, cy2] = offset(polar(middle, angle), angle - 90, LEAF.halfWidth * 2)

  return `<path d="M${format(x1)} ${format(y1)}Q${format(cx1)} ${format(cy1)} ${format(x2)} ${format(y2)}Q${format(cx2)} ${format(cy2)} ${format(x1)} ${format(y1)}Z"/>`
}

/** A point at `share` of the outer radius from the centre, `angle` degrees clockwise from 12 o'clock. */
function polar(share: number, angle: number): [number, number] {
  const radians = (angle * Math.PI) / 180

  return [CENTER + Math.sin(radians) * share * OUTER, CENTER - Math.cos(radians) * share * OUTER]
}

function offset([x, y]: [number, number], angle: number, share: number): [number, number] {
  const radians = (angle * Math.PI) / 180

  return [x + Math.sin(radians) * share * OUTER, y - Math.cos(radians) * share * OUTER]
}

function format(value: number): string {
  return String(Math.round(value * 10) / 10)
}
