import type { ReactElement } from 'react'
import { StyleSheet, View } from 'react-native'
import { SvgXml } from 'react-native-svg'
import { type FormFactor, useFormFactor } from '@/ui/form-factor'
import { medallionStroke, medallionSvg } from '@/ui/medallion'
import { color } from '@/ui/theme'

const STROKE_PT = 1.5

/** Medallion diameters: each is centred on a screen corner, so a quarter of it shows. */
const DIAMETERS: Record<FormFactor, { large: number; small: number }> = {
  tablet: {
    large: 760,
    small: 540,
  },
  phone: {
    large: 520,
    small: 300,
  },
}

interface OrnamentsProps {
  /** Opacity of the large medallion in the bottom-left corner; without it there is none. */
  largeOpacity?: number
  /** Opacity of the small medallion in the top-right corner. */
  smallOpacity: number
}

/**
 * The suzani medallion in the screen corners (DESIGN §2, Ornament): on the start and goodbye screens, and on every
 * parent screen whose top-right corner is free; never where the child plays. Draws behind the content and takes no
 * touches.
 */
export function Ornaments({ largeOpacity, smallOpacity }: OrnamentsProps): ReactElement {
  const diameters = DIAMETERS[useFormFactor()]

  return (
    <View style={styles.layer}>
      {largeOpacity !== undefined && (
        <Medallion
          opacity={largeOpacity}
          size={diameters.large}
          style={{
            left: -diameters.large / 2,
            bottom: -diameters.large / 2,
          }}
        />
      )}
      <Medallion
        opacity={smallOpacity}
        size={diameters.small}
        style={{
          right: -diameters.small / 2,
          top: -diameters.small / 2,
        }}
      />
    </View>
  )
}

interface MedallionProps {
  size: number
  opacity: number
  style: {
    left?: number
    right?: number
    top?: number
    bottom?: number
  }
}

function Medallion({ size, opacity, style }: MedallionProps): ReactElement {
  const xml = medallionSvg({
    stroke: color.ornament,
    strokeWidth: medallionStroke(STROKE_PT, size),
  })

  return (
    <View
      style={[
        styles.medallion,
        style,
        {
          width: size,
          height: size,
          opacity,
        },
      ]}
    >
      <SvgXml height={size} width={size} xml={xml} />
    </View>
  )
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  medallion: {
    position: 'absolute',
  },
})
