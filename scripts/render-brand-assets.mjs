/**
 * Renders the app icon and the splash image from the medallion (DESIGN §5), so the ornament has one source:
 * src/ui/medallion.ts. Run with `npm run brand-assets` after changing the medallion or the colors below.
 */
import { writeFileSync } from 'node:fs'

import { Resvg } from '@resvg/resvg-js'

import { medallionStroke, medallionSvg } from '../src/ui/medallion.ts'

/** color.accent, color.ground and color.ornament of src/ui/theme.ts, which cannot be imported here (it needs React Native). */
const ACCENT = '#2E7D6B'
const GROUND = '#F4EFE6'
const ORNAMENT = '#B9B1A2'

const ICON_SIZE = 1024
const ICON_MEDALLION = 860
const ICON_STROKE = 14

/** The splash image is drawn at SPLASH_WIDTH points (app.json, imageWidth) and rendered at 3x for sharp edges. */
const SPLASH_WIDTH = 240
const SPLASH_SCALE = 3
const SPLASH_STROKE = 1.5
const SPLASH_OPACITY = 0.4

/** Accent square with the medallion in the ground colour; opaque, as the App Store requires. */
function icon() {
  const offset = (ICON_SIZE - ICON_MEDALLION) / 2
  const medallion = medallionSvg({
    stroke: GROUND,
    strokeWidth: medallionStroke(ICON_STROKE, ICON_MEDALLION),
  }).replace('<svg ', `<svg x="${offset}" y="${offset}" width="${ICON_MEDALLION}" height="${ICON_MEDALLION}" `)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ICON_SIZE}" height="${ICON_SIZE}"><rect width="100%" height="100%" fill="${ACCENT}"/>${medallion}</svg>`
}

/** The medallion alone at 40%, on a transparent background; the splash screen paints the ground colour behind it. */
function splash() {
  const size = SPLASH_WIDTH * SPLASH_SCALE
  const medallion = medallionSvg({
    stroke: ORNAMENT,
    strokeWidth: medallionStroke(SPLASH_STROKE, SPLASH_WIDTH),
  }).replace('<svg ', `<svg width="${size}" height="${size}" opacity="${SPLASH_OPACITY}" `)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${medallion}</svg>`
}

function render(svg, path) {
  writeFileSync(path, new Resvg(svg).render().asPng())
  console.log(`wrote ${path}`)
}

render(icon(), 'assets/images/icon.png')
render(splash(), 'assets/images/splash-icon.png')

console.log(`splash background: ${GROUND}`)
