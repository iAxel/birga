# Birga — Spec v0.1

Goal of v0.1: prove one loop with one child. **Child wants something → taps a card → hears a parent's voice say the word → gets the thing from the parent.** Plus one turn-taking game built on his counting habit. Everything else waits.

Success is not "the app works". Success after 4 weeks of daily use:

- he taps cards to request instead of (or in addition to) leading by the hand;
- he vocalizes in pause windows more often than in week 1;
- ideally, some word approximations appear around request cards.

The event log exists to answer these questions with data.

---

## 1. Modes

### Child mode (default on launch)

No text menus, no settings, no way out except the hidden parent gate. Two screens: **Requests** and **Pause game**, switched by two large icon tabs at the bottom. Plus the **Goodbye** screen at session end.

### Parent mode

Entered by holding a small dim element in the top-right corner for 3 seconds. Contains: cards management, pause-game sequences, session settings, log view/export.

Recommend to the parent (in onboarding text) to use iOS **Guided Access** so the child cannot leave the app.

---

## 2. Requests screen

- Grid of **2, 4 or 6 cards** (parent setting; start with 2–4). Cards fill the screen.
- Card = real photo (optional: core words usually have none) + written word underneath (large, high contrast) + parent voice recording (required).
- On tap:
  1. card scales up to center, others dim;
  2. parent's recording plays once;
  3. card stays enlarged ~3 s (time for the parent to react and hand the item over), then returns.
- **Debounce:** after a tap, the same card is inert for 8 s (setting). Other cards also inert while audio plays. This prevents tap-loop stimming on the sound.
- A small "attempt" button is visible only to the parent's side of the screen (bottom corner, low contrast): parent taps it when the child tried to say the word. Logs `request_verbal_attempt` with the last tapped card.
- **Modeling toggle:** a second low-contrast corner control switches "parent is tapping" on/off (auto-off after 60 s). Parents are expected to use the board themselves while talking to the child (aided language modeling); those taps behave identically but are logged as `request_tap_model`, so child stats stay clean.
- Card order is fixed (parent-defined). Do not shuffle: position consistency is how AAC motor planning works.

**Starter content guidance (shown in the card editor empty state):** mix things he wants (suv, specific toys, swing) with **core words** that work everywhere: `yana` (more), `ber` (give), `yo'q` (no), `bo'ldi` (done/stop), `yordam` (help). Core words keep a fixed position on every board.

Card sets: parent can create several **boards** (e.g. "Ovqat", "O'yin") and pick which one is active. v0.1: one active board at a time, switched from parent mode only.

---

## 3. Pause game

Built on the child's love of sequences. The app says a familiar sequence in the parent's voice and **stops before the next item**, waiting for the child to fill in.

- A **sequence** = ordered list of items; each item = text + voice recording + optional image. Examples: `bir, ikki, uch, to'rt, besh`; later phrases with a gap: `Men … xohlayman`.
- Flow per round:
  1. App plays items 1..k (k chosen so that the pause falls at a different place each round, never before item 2).
  2. Character switches to "waiting" pose. Next item's **written text is shown** greyed out as a hint. Mic opens.
  3. **Pause window: 5 s** (setting).
     - Vocalization detected → `pause_filled`: reward animation (~1.5 s), app plays the item in parent's voice as confirmation, continues.
     - Nothing → `pause_timeout`: app simply says the item itself, neutral tone, continues. No negative feedback of any kind.
  4. Sequence finishes → short end animation → next round or stop.
- **Max 5 rounds per game**, then the game tab becomes inert until the next session (anti-loop).
- Parent "attempt" button works here too (`pause_parent_credit`), for when detection missed a quiet attempt.

### Vocalization detector

- Uses recorder metering only. No audio is saved.
- At session start: 2 s ambient baseline (median dB). Threshold = baseline + margin (default 12 dB, setting).
- Trigger: level above threshold for ≥ 250 ms within the pause window.
- Mic is opened only after app playback has fully ended + 150 ms guard, closed before playback resumes.
- Pure function over a stream of `(timestampMs, dB)` samples → unit-tested.

---

## 4. Session

- Session starts on entering child mode. Length: **10 min** default (setting: 5/10/15).
- Last minute: subtle visual countdown (a bar shrinking), no sound.
- At end: **Goodbye screen** — character waves, parent-voice "Xayr!" recording (optional), then a static calm screen. Nothing on it is tappable except the parent gate.
- New session only via parent mode. Optional setting: minimum break between sessions (default 30 min).

---

## 5. Parent mode details

### Card editor

- Take photo / pick from library → crop square. Optional.
- Type the word (any script, stored as typed).
- Record voice: hold-to-record, max 4 s, playback preview, re-record. Required: a card cannot be saved without it. Trim leading/trailing silence if feasible; otherwise skip in v0.1.
- Assign to board, set position.

### Sequence editor

- Add items in order: text + recording (+ optional image).

### Settings

Cards per screen, debounce seconds, pause window seconds, detection margin dB, session length, min break.

### Log

- Simple daily summary list: session count, request taps per card, pause filled / timeout ratio, parent-credited attempts.
- **Export** as CSV/JSON via share sheet. This is the only way data leaves the device.

---

## 6. Data model (SQLite)

```
boards(id, title, position, is_active, created_at)
cards(id, board_id, text, image_path, audio_path, position, is_archived, created_at)
sequences(id, title, is_active, created_at)
sequence_items(id, sequence_id, position, text, audio_path, image_path)
sessions(id, started_at, ended_at, end_reason)            -- timer | parent_exit | app_killed
events(id, session_id, ts, type, card_id, sequence_id, item_position, payload_json)
settings(key, value)
```

- Paths are relative to the app document directory. `cards.audio_path` is required, `cards.image_path` is optional.
- Cards are archived, never hard-deleted, so old events keep their references.

### Event types

`session_start`, `session_end`, `request_tap`, `request_tap_model`, `request_tap_debounced`, `request_verbal_attempt`, `pause_open`, `pause_filled`, `pause_timeout`, `pause_parent_credit`, `game_round_end`, `parent_gate_open`, `tab_switch`.

`request_tap_debounced` matters: a high count on one card means he is looping on it, which is a signal to change the card or the debounce.

`tab_switch` is logged when the child switches between Requests and Pause game; payload `{to}` is the tab he switched to: `requests` or `pause_game`.

---

## 7. Build order

1. Expo project, Router skeleton, SQLite + migrations, theme.
2. Parent mode: card editor (photo + text + voice). Without content nothing else is testable.
3. Requests screen with debounce + event logging.
4. Session timer + Goodbye screen + parent gate.
5. First EAS Build → TestFlight (needs Apple Developer Program membership). Expo Go is fine for development but not for daily use by the child.
   **→ Put it in the child's hands here.** Observe for several days before building more.
6. Sequence editor + Pause game without mic (timeout-only, parent credit button).
7. Vocalization detector + mic integration.
8. Log summary + export.

Step 5 is deliberate. What he actually does with the request board will change the rest of this spec.

---

## 8. Open questions (decide with real usage, not upfront)

- Does a full-screen enlarged card help or does he try to dismiss it?
- Is 8 s debounce frustrating or fine?
- Does greyed-out hint text in the pause help, or does he read it as a cue to recite on a loop?
- iPhone vs iPad: a bigger, shared screen on a table is better for co-play if an iPad is available.
