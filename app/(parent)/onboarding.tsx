import { useRouter } from 'expo-router'
import { type SFSymbol, SymbolView } from 'expo-symbols'
import type { PropsWithChildren, ReactElement, ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useRepositories } from '@/db'
import { useActiveBoard } from '@/features/cards/use-active-board'
import { useSaveSetting, useSettings } from '@/features/settings/settings-provider'
import { strings } from '@/i18n'
import { Panel } from '@/ui/panel'
import { ParentButton } from '@/ui/parent-button'
import { ParentScreen } from '@/ui/parent-screen'
import { color, font, radius, space, typography } from '@/ui/theme'

/** Cards the board needs before the first session makes sense. */
const CARD_GOAL = 2

const STEP_MARK_SIZE = 36

interface StepProps extends PropsWithChildren {
  number: number
  title: string
  isActive?: boolean
  isDone?: boolean
  /** Right end of the step's title line, e.g. the card counter. */
  accessory?: ReactNode
}

/**
 * First launch (SPEC §1, DESIGN §3): why the app is used together, then four steps. Only the first, adding two cards,
 * is done here; the others are advice. Boshlash stays off until two cards exist, then marks the onboarding done and
 * leads to parent home, or back to settings when it was opened from there. The first card goes onto a board "Uy",
 * created here, which becomes the active one.
 */
export default function OnboardingScreen(): ReactElement {
  const router = useRouter()
  const repositories = useRepositories()
  const settings = useSettings()
  const saveSetting = useSaveSetting()
  const activeBoard = useActiveBoard()
  const cardCount = activeBoard?.cardCount ?? 0
  const hasCards = cardCount >= CARD_GOAL

  async function addCard(): Promise<void> {
    if (activeBoard === undefined) {
      return
    }

    const boardId = activeBoard ? activeBoard.board.id : await repositories.boards.create(strings.onboarding.firstBoard)

    router.push({
      pathname: '/card/new',
      params: {
        boardId,
      },
    })
  }

  async function finish(): Promise<void> {
    await saveSetting('onboardingDone', true)

    if (router.canGoBack()) {
      router.back()

      return
    }

    router.replace('/parent')
  }

  return (
    <ParentScreen
      footer={
        <View style={styles.footer}>
          <ParentButton disabled={!hasCards} onPress={finish} title={strings.onboarding.start} variant="primary" />
          {!hasCards && <Text style={[typography.body, styles.centered]}>{strings.onboarding.startHint(CARD_GOAL)}</Text>}
        </View>
      }
      hasBack={false}
      title={strings.onboarding.title}
    >
      <Text style={styles.why}>{strings.onboarding.why}</Text>
      <Step
        accessory={
          <Text style={styles.counter}>{strings.onboarding.cardsCount(Math.min(cardCount, CARD_GOAL), CARD_GOAL)}</Text>
        }
        isActive={!hasCards}
        isDone={hasCards}
        number={1}
        title={strings.onboarding.cardsStep(CARD_GOAL)}
      >
        <Text style={styles.text}>{strings.onboarding.cardsText}</Text>
        <ParentButton onPress={addCard} title={strings.cards.add} variant={hasCards ? 'outline' : 'primary'} />
      </Step>
      <Step isActive={hasCards} number={2} title={strings.onboarding.guidedAccessStep}>
        <Text style={styles.text}>{strings.onboarding.guidedAccessText}</Text>
      </Step>
      <Step number={3} title={strings.onboarding.cornersStep}>
        <CornerHint icon="bubble.left" text={strings.onboarding.cornersAttempt} />
        <CornerHint icon="hand.tap" text={strings.onboarding.cornersModeling} />
      </Step>
      <Step number={4} title={strings.onboarding.sessionStep}>
        <Text style={styles.text}>{strings.onboarding.sessionText(settings.sessionMinutes)}</Text>
      </Step>
    </ParentScreen>
  )
}

interface CornerHintProps {
  icon: SFSymbol
  text: string
}

/** One of the two parent controls of the board, shown with the icon the parent will look for in the corner. */
function CornerHint({ icon, text }: CornerHintProps): ReactElement {
  return (
    <View style={styles.cornerHint}>
      <View style={styles.cornerIcon}>
        <SymbolView name={icon} size={20} tintColor={color.muted} />
      </View>
      <Text style={[styles.text, styles.cornerText]}>{text}</Text>
    </View>
  )
}

/** One step: a numbered mark, then a check once it is done; the step to do now has an accent frame. */
function Step({ number, title, isActive = false, isDone = false, accessory, children }: StepProps): ReactElement {
  return (
    <Panel style={isActive && styles.activeStep}>
      <View style={styles.stepHeader}>
        <View style={[styles.mark, (isActive || isDone) && styles.markOn]}>
          {isDone ? (
            <SymbolView name="checkmark" size={16} tintColor={color.card} weight="bold" />
          ) : (
            <Text style={[styles.markNumber, (isActive || isDone) && styles.markNumberOn]}>{number}</Text>
          )}
        </View>
        <Text style={[typography.row, styles.stepTitle]}>{title}</Text>
        {accessory}
      </View>
      {children}
    </Panel>
  )
}

const styles = StyleSheet.create({
  why: {
    ...typography.row,
    marginTop: -space.sm,
    color: color.muted,
    fontFamily: font.regular,
    lineHeight: 24,
  },
  activeStep: {
    borderWidth: 2,
    borderColor: color.accent,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  mark: {
    width: STEP_MARK_SIZE,
    height: STEP_MARK_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: color.hint,
    borderRadius: STEP_MARK_SIZE / 2,
  },
  markOn: {
    borderColor: color.accent,
    backgroundColor: color.accent,
  },
  markNumber: {
    ...typography.button,
    color: color.muted,
  },
  markNumberOn: {
    color: color.card,
  },
  stepTitle: {
    flex: 1,
    fontFamily: font.bold,
    fontSize: 19,
  },
  counter: {
    ...typography.button,
    color: color.muted,
  },
  cornerHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  cornerIcon: {
    width: STEP_MARK_SIZE,
    height: STEP_MARK_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: color.cardLine,
    borderRadius: radius.buttonSm,
  },
  cornerText: {
    flex: 1,
  },
  text: {
    ...typography.row,
    color: color.muted,
    fontFamily: font.regular,
    fontSize: 16,
    lineHeight: 23,
  },
  footer: {
    gap: space.sm,
  },
  centered: {
    textAlign: 'center',
  },
})
