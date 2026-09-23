import { type FormFactor, useFormFactor } from '@/ui/form-factor'
import { space, touch } from '@/ui/theme'

/** Distance of the parent gate from the top and left safe-area edges. */
export const GATE_INSET = 2

/** Room kept between a tab target and the parent's corner control beside it. */
const CORNER_CLEARANCE = space.xs

/** Distances of child mode for one device size (DESIGN §2–3), all measured from the safe area. */
export interface ChildMetrics {
  formFactor: FormFactor
  /** Side margin of the board. */
  pad: number
  /** Gap between cards. */
  gap: number
  /** Margin above the board. A tablet has room for the parent gate in its side margin; on a phone the board starts below it. */
  top: number
  /** Hit area of a parent corner control. */
  corner: number
  /** Distance of the corner controls from the bottom and side edges. */
  cornerMargin: number
  /** Gap between the two tab targets. */
  tabGap: number
}

const METRICS: Record<FormFactor, ChildMetrics> = {
  tablet: {
    formFactor: 'tablet',
    pad: space.childPad,
    gap: space.childGap,
    top: space.childGap,
    corner: 56,
    cornerMargin: 20,
    tabGap: space.xxl,
  },
  phone: {
    formFactor: 'phone',
    pad: space.parentPad,
    gap: space.md,
    top: GATE_INSET + touch.parent + space.xs,
    corner: 52,
    cornerMargin: space.sm,
    tabGap: space.lg,
  },
}

export function useChildMetrics(): ChildMetrics {
  return METRICS[useFormFactor()]
}

/**
 * The gap between the two tab targets: the design's gap where the screen is wide enough for it, less on a narrow
 * phone, so a target never reaches into the parent's corner control beside it (DESIGN §2). On a 375 pt iPhone the full
 * gap put 4.5 pt of each tab target over a corner, and the tab bar, drawn on top, took the parent's taps.
 */
export function tabBarGap(screenWidth: number, sideInset: number, metrics: ChildMetrics): number {
  const corners = 2 * (sideInset + metrics.cornerMargin + metrics.corner + CORNER_CLEARANCE)
  const room = screenWidth - corners - 2 * touch.child

  return Math.max(0, Math.min(metrics.tabGap, room))
}
