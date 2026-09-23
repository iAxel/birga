import { type FormFactor, useFormFactor } from '@/ui/form-factor'
import { space, touch } from '@/ui/theme'

/** Distance of the parent gate from the top and left safe-area edges. */
export const GATE_INSET = 2

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
