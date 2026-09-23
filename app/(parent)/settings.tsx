import { useRouter } from 'expo-router'
import { type ReactElement, useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import {
  CARDS_PER_SCREEN_OPTIONS,
  DEBOUNCE_SECONDS_OPTIONS,
  MIN_BREAK_MINUTES_OPTIONS,
  PAUSE_WINDOW_SECONDS_OPTIONS,
  SESSION_MINUTES_OPTIONS,
} from '@/db'
import { useSaveSetting, useSettings } from '@/features/settings/settings-provider'
import { strings } from '@/i18n'
import { ChipGroup } from '@/ui/chips'
import { fontForText } from '@/ui/fonts'
import { useFormFactor } from '@/ui/form-factor'
import { ListRow, Panel, SectionLabel } from '@/ui/panel'
import { ParentScreen } from '@/ui/parent-screen'
import { SwitchRow } from '@/ui/switch-row'
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

  /**
   * Opens the onboarding again. The done flag stays as it is: clearing it would leave the app asking for the onboarding
   * at the next launch if the parent simply swiped this screen away.
   */
  function showOnboarding(): void {
    router.push('/onboarding')
  }

  return (
    <ParentScreen title={strings.parent.settings}>
      <Panel>
        <SectionLabel title={strings.settings.childSection} />
        <Text style={typography.row}>{strings.settings.childName}</Text>
        <ChildNameField />
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
        <SectionLabel title={strings.settings.gameSection} />
        <SwitchRow
          onChange={(value) => saveSetting('pauseGameEnabled', value)}
          title={strings.settings.gameEnabled}
          value={settings.pauseGameEnabled}
        />
        <Text style={typography.body}>{strings.settings.gameEnabledHint}</Text>
        <View style={styles.setting}>
          <Text style={typography.row}>{strings.settings.pauseWindow}</Text>
          <ChipGroup
            label={strings.settings.seconds}
            onChange={(option) => saveSetting('pauseWindowSeconds', option)}
            options={PAUSE_WINDOW_SECONDS_OPTIONS}
            value={settings.pauseWindowSeconds}
          />
          <Text style={typography.body}>{strings.settings.pauseWindowHint}</Text>
        </View>
        <SwitchRow
          onChange={(value) => saveSetting('rewardGlow', value)}
          title={strings.settings.rewardGlow}
          value={settings.rewardGlow}
        />
        <SwitchRow
          onChange={(value) => saveSetting('rewardSparks', value)}
          title={strings.settings.rewardSparks}
          value={settings.rewardSparks}
        />
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

/**
 * The child's name, as typed. The field keeps what was typed and writes it through: reading it back from the database
 * between keystrokes is a round trip per letter, and a letter typed during one of them is lost.
 */
function ChildNameField(): ReactElement {
  const settings = useSettings()
  const saveSetting = useSaveSetting()
  const [name, setName] = useState(settings.childName)

  function type(text: string): void {
    setName(text)

    saveSetting('childName', text)
  }

  return (
    <TextInput
      autoCapitalize="words"
      autoCorrect={false}
      onChangeText={type}
      placeholder={strings.settings.childNamePlaceholder}
      placeholderTextColor={color.hint}
      returnKeyType="done"
      style={[styles.name, fontForText(name, font.semiBold)]}
      value={name}
    />
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
