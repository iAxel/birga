import { useRouter } from 'expo-router'
import type { ReactElement } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { CARDS_PER_SCREEN_OPTIONS, DEBOUNCE_SECONDS_OPTIONS, MIN_BREAK_MINUTES_OPTIONS, SESSION_MINUTES_OPTIONS } from '@/db'
import { useSaveSetting, useSettings } from '@/features/settings/settings-provider'
import { strings } from '@/i18n'
import { ChipGroup } from '@/ui/chips'
import { fontForText } from '@/ui/fonts'
import { useFormFactor } from '@/ui/form-factor'
import { ListRow, Panel, SectionLabel } from '@/ui/panel'
import { ParentScreen } from '@/ui/parent-screen'
import { color, font, radius, space, typography } from '@/ui/theme'

const NAME_HEIGHT = 48

/**
 * Parent settings (SPEC §5): the child's name for the start screen, how many cards the child sees, how long a card
 * stays silent after the child played it, how long a session lasts, the break before the next one, and the parent's
 * "Xayr!" for its end. The name is stored as typed.
 */
export default function SettingsScreen(): ReactElement {
  const router = useRouter()
  const settings = useSettings()
  const saveSetting = useSaveSetting()
  const isPhone = useFormFactor() === 'phone'

  /** Opens the onboarding again; finishing it marks it done and comes back here. */
  async function showOnboarding(): Promise<void> {
    await saveSetting('onboardingDone', false)

    router.push('/onboarding')
  }

  return (
    <ParentScreen title={strings.parent.settings}>
      <Panel>
        <SectionLabel title={strings.settings.childSection} />
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          onChangeText={(text) => saveSetting('childName', text)}
          placeholder={strings.settings.childNamePlaceholder}
          placeholderTextColor={color.hint}
          returnKeyType="done"
          style={[styles.name, fontForText(settings.childName, font.semiBold)]}
          value={settings.childName}
        />
        <Text style={typography.body}>{strings.settings.childNameHint}</Text>
      </Panel>
      <Panel>
        <SectionLabel title={strings.settings.requestsSection} />
        <View style={styles.setting}>
          <Text style={typography.row}>{strings.settings.cardsPerScreen}</Text>
          <ChipGroup
            label={String}
            onChange={(option) => saveSetting('cardsPerScreen', option)}
            options={CARDS_PER_SCREEN_OPTIONS}
            value={settings.cardsPerScreen}
          />
          {isPhone && <Text style={typography.body}>{strings.settings.cardsPerScreenPhoneHint}</Text>}
        </View>
        <View style={styles.setting}>
          <Text style={typography.row}>{strings.settings.debounce}</Text>
          <ChipGroup
            label={strings.settings.seconds}
            onChange={(option) => saveSetting('debounceSeconds', option)}
            options={DEBOUNCE_SECONDS_OPTIONS}
            value={settings.debounceSeconds}
          />
          <Text style={typography.body}>{strings.settings.debounceHint}</Text>
        </View>
      </Panel>
      <Panel>
        <SectionLabel title={strings.settings.sessionSection} />
        <View style={styles.setting}>
          <Text style={typography.row}>{strings.settings.sessionLength}</Text>
          <ChipGroup
            label={strings.settings.minutes}
            onChange={(option) => saveSetting('sessionMinutes', option)}
            options={SESSION_MINUTES_OPTIONS}
            value={settings.sessionMinutes}
          />
        </View>
        <View style={styles.setting}>
          <Text style={typography.row}>{strings.settings.minBreak}</Text>
          <ChipGroup
            label={(option) => (option === 0 ? strings.settings.noBreak : strings.settings.minutes(option))}
            onChange={(option) => saveSetting('minBreakMinutes', option)}
            options={MIN_BREAK_MINUTES_OPTIONS}
            value={settings.minBreakMinutes}
          />
        </View>
      </Panel>
      <Panel hasRows>
        <ListRow
          hasSeparator
          onPress={() => router.push('/goodbye-voice')}
          title={strings.settings.goodbyeVoice}
          value={settings.goodbyeAudioPath ? strings.settings.goodbyeVoiceRecorded : strings.settings.goodbyeVoiceMissing}
        />
        <ListRow onPress={showOnboarding} title={strings.settings.showOnboarding} />
      </Panel>
    </ParentScreen>
  )
}

const styles = StyleSheet.create({
  name: {
    height: NAME_HEIGHT,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: color.cardLine,
    borderRadius: radius.buttonSm,
    backgroundColor: color.ground,
    color: color.ink,
    fontSize: 17,
  },
  setting: {
    gap: space.sm,
  },
})
