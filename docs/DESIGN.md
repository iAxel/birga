
# Birga — Design handoff (v0.1)

Source of truth for visuals. Mockups: `docs/design/*.png` (exported from the design canvas). If a mockup and this file disagree, this file wins; if this file and CLAUDE.md design principles disagree, CLAUDE.md wins.

## 1. Tokens

Put these in `src/ui/theme.ts`. No other colors in the app.

```ts
export const color = {
  ground:   '#F4EFE6', // every screen background
  card:     '#FFFDF9', // cards, panels, list groups
  cardLine: '#E6DFD2', // card border 2 pt (child), panel border 1 pt (parent)
  photoBg:  '#E9E2D6', // photo placeholder / thumbnail background
  ink:      '#201C17', // primary text
  muted:    '#8A8377', // secondary text, labels, inactive icons
  hint:     '#D9D1C3', // pause-game hint text, dividers, parent gate dot
  faint:    '#D0C8B9', // parent corner icons on child screens
  panelAlt: '#EFE9DE', // secondary buttons in parent mode
  accent:   '#2E7D6B', // ONLY: tap feedback ring, parent primary buttons, active icons
  accentBg: '#DDEDE8', // accent tint (badges, play buttons)
  reward:   '#F3D89A', // pause-filled glow, 45% opacity
  rewardInk:'#D99A2B', // sparks, checkmark
  danger:   '#A05A4A', // archive text button only
} as const;

export const radius = { card: 28, photo: 20, tapCard: 36, panel: 20, button: 16, buttonSm: 14, pill: 48 };
export const space  = { childPad: 48, childGap: 24, tabBar: 132, childTarget: 120, parentPad: 20, parentGap: 12 };
```

Typography: Manrope (bundle `Manrope-Regular/Medium/SemiBold/Bold/ExtraBold` via `expo-font`; fallback `System`). Latin and Cyrillic, incl. Ğ Ö Ş Ç.

*Built differently:* Manrope has no Ғ Қ Ҳ and no ʻ ʼ (U+02BB, U+02BC). A word the parent typed that contains one of them is drawn in the system font as a whole, rather than mixing two fonts inside one word.

| Role                                  | Size                     | Weight    | Tracking               |
| ------------------------------------- | ------------------------ | --------- | ---------------------- |
| Card word, no photo (iPad)            | 104                      | 800       | -2                     |
| Card word, no photo (iPhone)          | 88                       | 800       | -2                     |
| Card word under photo (iPad / iPhone) | 52 / 44                  | 700       | -0.5                   |
| Enlarged card word (iPad / iPhone)    | 88 / 68                  | 800       | -1.5                   |
| Pause hint digit (iPad / iPhone)      | 220 / 180                | 800       | -6 / -5                |
| Pause hint word (iPad / iPhone)       | 64 / 52                  | 700       | -1                     |
| Pause said items: digit / word        | 64 / 26 (iPhone 44 / 18) | 800 / 600 |                        |
| Wordmark "Birga" (iPad / iPhone)      | 96 / 72                  | 800       | -3 / -2.5              |
| Goodbye "Xayr!" (iPad / iPhone)       | 160 / 104                | 800       | -5 / -3.5              |
| Parent screen title                   | 28                       | 800       | -0.5                   |
| Parent section label                  | 13                       | 700       | +0.5, uppercase, muted |
| Parent list row                       | 17                       | 600       |                        |
| Parent body / hints                   | 14 / 12                  | 400–500  | muted                  |
| Parent buttons                        | 17 (primary) / 15        | 700       |                        |

## 2. Components

**Card (child).** `card` background, 2 pt `cardLine` border, radius 28. With photo: photo fills top ~70% with 12 pt inset and radius 20, word centered in a 92 pt (iPad) / 76 pt (iPhone) strip below. Without photo: word centered. No shadows at rest.

**Enlarged card (tap).** Scales/moves to center over 300 ms ease-out, others fade to 28% opacity. 4 pt `accent` border, radius 36, shadow `0 24 60 rgba(32,28,23,0.18)`. Small speaker icon (`accent`) next to the word while audio plays. Returns after 3 s or audio end, whichever is later.

*Built differently:* the enlarged card keeps the proportions of its slot instead of the squarer shape of the mockup. It moves and scales as one piece, and changing its shape on the way would squeeze the photo. On an iPhone, where two stacked cards already fill the width, it therefore mostly moves to the middle rather than growing.

**Tab bar (child).** Height 132, two 120×120 circular targets, gap 48 (iPad) / 24 (iPhone). Active: `cardLine` fill, `ink` icon. Inactive: no fill, `muted` icon. Hidden entirely while `pauseGameEnabled` is off.

**Parent corners (child screens).** 56×56 (iPad) / 52×52 (iPhone) hit areas, 26 pt icons in `faint`, no background. Left-bottom: speech bubble = attempt, a tap credits it. Right-bottom: tapping hand = modeling toggle. Top-left: parent gate.

*Built differently:* the check became a speech bubble (a check reads as "correct", and the app never judges) and the raised hand became a tapping hand. Holding the bubble records the attempt, which CLAUDE.md now allows as the one child audio the app keeps: parent-initiated, never played back, and only leaving the device with the export.

**Parent gate.** 12 pt dot in `hint`, 44×44 hit area, 3-second hold, in the **top-left** corner. While holding: a 2 pt `accent` ring around the dot fills clockwise over the 3 s; release resets it. No other feedback.

*Built differently:* the gate moved from the top-right corner to the top-left one, where no screen draws anything; against the medallion the dot was hard to make out.

**Modeling indicator.** When modeling is on: hand icon switches to `accent` and a 3 pt `accent` bar spans the bottom edge. Auto-off after 60 s.

**Pause game.** Said items in `muted` as digit-over-word pairs. Hint (next item) in `hint`: symbol (if any) above word. Three 12 pt dots below the hint pulse slowly while the mic is open. On `pause_filled`: hint turns `ink`, `reward` ellipse at 45% behind it (460×340 iPad / 300×260 iPhone), 8 `rewardInk` sparks rise 80–150 pt from the word and fade over 600 ms, `rewardInk` checkmark replaces the dots. Whole reward ≤ 1.5 s, then next item plays. On timeout: hint turns `ink` with no glow/sparks as the app says the item. Both glow and sparks are settings, default on.

*Built differently:* where the sizes above do not fit — a phone held sideways, or an item with both an image and a symbol — the said items and the hint shrink together, as one piece, until they fit between the top edge and the tab bar. The word is never pushed under the tabs.

**Session countdown.** Last minute: 3 pt bar at the top edge, `hint` color, shrinking right-to-left. No sound.

**Ornament.** Suzani-style medallion (concentric rings, 8 petals, 16 dots, 8 leaves; stroke only, `#B9B1A2`). Bottom-left large + top-right small on Start and Goodbye; one small top-right on every parent screen. Opacity: Start 60%/48%, Goodbye 45%/36%, parent 40%. Never on Requests, Tap, or Pause screens. One SVG, generated from `src/ui/medallion.ts`, positioned with absolute layout.

*Built differently:* the medallion is on the parent screens whose top-right corner is free, not only home and onboarding: the plain screens looked unfinished beside them. Where the header has something in that corner (the FAOL badge of an active board, the board name in the card editor) there is no medallion, so nothing sits on top of text. Home dropped its "Ota-ona" label to keep the medallion.

**Parent mode.** iOS-grouped-list feel: `card` panels radius 20 with 1 pt `cardLine`, rows 56–72 pt, chevrons in `hint`. Primary button `accent` 56 pt radius 16; secondary `panelAlt`; outline buttons 1.5 pt `hint` border.

## 3. Screens

Child mode, iPad landscape (1180×820 pt reference): Start (idle) → Requests (2×2 default) → Tap state → Pause wait → Pause filled → Goodbye.
Child mode, iPhone portrait (390×844): same flow; Requests shows **2 cards stacked**, not 2×2. "Cards per screen = 4" on a phone is not supported in v0.1; clamp to 2 and note it in settings.

Start (idle): wordmark, subtitle "Suleyman bilan birga o'ynaymiz" (subtitle text is a setting: child's name), tiny hint "Sessiyani ota-ona boshlaydi" in `hint`. No button. Parent gate only.

Goodbye: waving-hand line icon in `accent` (SF Symbol `hand.wave` is fine), "Xayr!", "Ertaga yana o'ynaymiz". Nothing tappable except the gate.

Parent mode, iPhone: Onboarding (first launch only) → Home → Boards / Board → Card editor; Sequences (step 6); Log; Settings.

*Built differently:* Settings and the goodbye-voice screen are not native forms. They brought their own grey background, blue controls and navigation bar, so they use the same header, panels and ground colour as the rest, and their values are chips instead of native pickers.

Home: session panel (idle: "Sessiya yo'q", last session time, primary "Yangi sessiya · 10 daqiqa", board summary; running: time left, progress bar, "Davom etish" / "Tugatish"), list (Kartalar, Ketma-ketliklar, Kundalik, Sozlamalar), "Bugungi maslahat" panel (one rotating parent tip from a static list in `uz.ts`), bottom outline "Yopish".

Board: title + FAOL badge, hint "Bola birinchi N ta kartani ko'radi", rows with thumbnail (or word tile for photo-less cards), word, voice duration, up/down arrows; divider "bola ko'rmaydi" before the (N+1)th card, those rows at 60% opacity; primary "Karta qo'shish".

Card editor, top to bottom: RASM panel (square preview 168 pt centered; Kamera / Galereya / remove), SO'Z field (56 pt, 26/700), OVOZ panel (status, waveform of the recording, Eshitish / Qayta yozish / import-file icon button, hint), primary Saqlash, danger text "Arxivga yuborish". Board picker stays as a row only when more than one board exists.

*Built differently:* the waveform is the real shape of the take. The microphone level is sampled ten times a second while the parent speaks and kept with the card, so the bars are there when the card is opened again; a card recorded before that has flat bars. While the recording plays, the bars it has passed stay `accent` and the rest turn `hint`, so the row is also the playback position. A ready recording can be imported instead of recorded: the third button of the OVOZ row opens the file picker and refuses a file longer than four seconds.

Log: week strip (7 tiles, accent tint by activity), "BUGUN" stats (sessiya / bosish / aytishga urindi), URINISHLAR·YOZUVLAR list (play button, card, time · duration), KARTALAR BO'YICHA bars, loop warning panel when `request_tap_debounced` for one card ≥ 5 in a day. Export icon top-right.

Onboarding: "Boshlaymiz" + one-line why; step 1 active (add 2 cards, counter, primary button), steps 2–3 (Guided Access path; the session script) inactive; disabled "Boshlash" until 2 cards exist. Shown on first launch, and again from Settings when the parent asks for it.

*Built differently:* step 3 is the whole session script of SPEC §5, which is also where the two corner controls are explained; and Settings has a row that opens the onboarding again.

## 4. Motion

300 ms ease-out, one property per element, no springs, no bounces. Respect Reduce Motion: replace moves/scales with cross-fades. Reward sparks are the only multi-element animation in the app.

## 5. Assets

App icon: `accent` background, medallion in `ground`, no text, 1024×1024 opaque PNG. Splash: `ground` with the medallion at 40% centered, 240 pt wide.

Both are rendered from `src/ui/medallion.ts` by `npm run brand-assets`, so the ornament has one source.

## 6. Spec additions carried by this handoff (update SPEC.md)

1. §2 Attempt corner: tap = `request_verbal_attempt`; hold = record up to 4 s to `media/attempts/`, event `attempt_recorded {card_id | sequence_id+item_position, audio_path, duration_ms}`. Parent-initiated only. Never played back to the child.
2. §3 Sequence item gets optional `symbol` (one character) shown above the text; optional image shown above the symbol at 160 pt. Reward `glow` and `sparks` are settings.
3. §5 Card editor: audio import via `expo-document-picker` (m4a/wav/mp3), reject > 4 s with a hint. Log gains an Urinishlar section; attempt files are included in export.
4. §5 Onboarding screen on first launch; parent tips list.
5. §5 Settings: child's name (subtitle), glow, sparks.
6. Parent gate hold ring; modeling indicator; last-minute bar (spec already had the bar, keep 3 pt at top).
7. iPhone Requests layout = 2 stacked cards.

## 7. Not built yet

Named here so the mockups are not read as a promise:

- **The vocalization detector**: the pause ends on the parent's button or when its time runs out; the microphone comes with build step 7.
- **The "waiting" character**: the pause game shows the hint and three dots, no character; v0.1 has none anywhere.
- **Values that need data the app does not keep:** the voice length and the recorder's name in the board rows.
