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

The Pause game tab is behind a setting, off by default until the game exists. While it is off there is no tab bar at all.

### Parent mode

Entered by holding a small dim element in the top-left corner for 3 seconds. While it is held, a thin ring around it fills clockwise over the 3 s; letting go resets it. No other feedback. Contains: cards management, pause-game sequences, session settings, log view/export.

Recommend to the parent (in onboarding text) to use iOS **Guided Access** so the child cannot leave the app.

**Onboarding** is shown on first launch: a short why, then three steps. Step 1, add 2 cards, is active with a counter and a button; step 2 turns on Guided Access; step 3 is the whole session script of "Sessiya qanday o'tadi" (§5), not a summary of it. "Boshlash" stays disabled until 2 cards exist. Once completed it is not shown again, and Settings can open it any time.

The parent home screen shows one parent tip at a time from a static list ("Bugungi maslahat").

---

## 2. Requests screen

- Grid of **2, 4 or 6 cards** (parent setting, default 4). Cards fill the screen. A board may hold more cards: the child sees the first ones in their order, and the board screen in parent mode marks where the visible ones end.
- On an iPhone the grid is **2 cards stacked**. 4 or 6 cards per screen are not supported on a phone in v0.1: the phone shows 2, and Settings says so.
- Card = real photo (optional: core words usually have none) + written word underneath (large, high contrast) + parent voice recording (required).
- On tap:
  1. card scales up to center, others dim;
  2. parent's recording plays once;
  3. card stays enlarged ~3 s, longer if the recording is longer (time for the parent to react and hand the item over), then returns. Until it has returned, every card is inert.
- **Debounce:** after a tap, the same card is inert for 8 s (setting). This prevents tap-loop stimming on the sound. Every ignored tap of the child is logged as `request_tap_debounced` with payload `{reason}`: `repeat` (same card within the debounce) or `busy` (a request is still on screen).
- A small "attempt" button is visible only to the parent's side of the screen (bottom corner, low contrast): parent taps it when the child tried to say the word. Logs `request_verbal_attempt` with the last tapped card.
  - Holding the same button records the attempt itself, up to 4 s, into `media/attempts/`, logged as `attempt_recorded {card_id | sequence_id + item_position, payload: audioPath, durationMs}`. Only the parent starts such a recording, it is never played back to the child, and it stays on the device until the parent exports the log.
- **Modeling toggle:** a second low-contrast corner control switches "parent is tapping" on/off (auto-off after 60 s). Parents are expected to use the board themselves while talking to the child (aided language modeling); those taps behave identically but are logged as `request_tap_model`, so child stats stay clean. Parent taps do not start the per-card debounce (the child may repeat the modelled card right away), and parent taps the board ignores are not logged. While modeling is on, the hand icon turns accent and a thin accent bar spans the bottom edge.
- Card order is fixed (parent-defined). Do not shuffle: position consistency is how AAC motor planning works.

**Starter content guidance (shown in the card editor empty state):** mix things he wants (suv, specific toys, swing) with **core words** that work everywhere: `yana` (more), `ber` (give), `yo'q` (no), `bo'ldi` (done/stop), `yordam` (help). Core words keep a fixed position on every board.

Card sets: parent can create several **boards** (e.g. "Ovqat", "O'yin") and pick which one is active. v0.1: one active board at a time, switched from parent mode only.

---

## 3. Pause game

Built on the child's love of sequences. The app says a familiar sequence in the parent's voice and **stops before the next item**, waiting for the child to fill in.

- A **sequence** = ordered list of items; each item = text + voice recording + optional **symbol** (one character, e.g. a digit, shown above the text) + optional image (shown above the symbol at 160 pt). Examples: `bir, ikki, uch, to'rt, besh`; later phrases with a gap: `Men … xohlayman`.
- Flow per round:
  1. App plays items 1..k (k chosen so that the pause falls at a different place each round, never before item 2).
  2. Character switches to "waiting" pose. Next item's **written text is shown** greyed out as a hint. Mic opens.
  3. **Pause window: 5 s** (setting).
     - Vocalization detected → `pause_filled`: reward animation (~1.5 s: the hint turns ink over a soft glow, a few sparks rise and fade), app plays the item in parent's voice as confirmation, continues. Glow and sparks are settings, both on by default.
     - Nothing → `pause_timeout`: the hint turns ink without glow or sparks while the app simply says the item itself, neutral tone, continues. No negative feedback of any kind.
  4. Either way the app waits a second after the item the pause was about before carrying on: that is the moment the child is most likely to say the word after it.
  5. Sequence finishes → short end animation → next round or stop.
- **5 rounds per game by default** (setting: 3/5/8), then the game tab becomes inert until the next session (anti-loop). The tab shows its play button greyed out and does nothing; the parent is told the number on the Ketma-ketliklar screen.
- Parent "attempt" button works here too (`pause_parent_credit`), for when detection missed a quiet attempt. Holding it records the sound itself, exactly as on the request board, logged as `attempt_recorded` against the item the round pauses on (`sequence_id` + `item_position`).

### Vocalization detector

- Uses recorder metering only. No audio is saved: expo-audio always writes a file, that file is deleted the moment the microphone closes, and a take left behind by an app that died mid-pause is deleted at start-up.
- Mic is opened 150 ms after app playback has fully ended, closed before playback resumes. Listening starts with the first reading, against the last known baseline, so the beginning of a pause is never a deaf spot.
- Threshold = baseline + margin (default 12 dB, setting). Baseline = median dB of a measurement of the room, measured again and again:
  - 2 s while the game waits on its play button, which sets it outright;
  - the first 500 ms of a pause window, which may only **lower** it: the child may be speaking into that half second, and a raised baseline would make the game deaf exactly where it is meant to listen;
  - the last 500 ms of a pause that ended in `pause_timeout` — nothing was said into it, so that is an honest measurement of the room, and the only way the baseline rises during a game.
- Trigger: level above threshold for ≥ 250 ms within the pause window.
- A development build logs every hearing with the baseline, the threshold and the loudest level of the window, which is how the margin is chosen against the room the child is actually in. A release build prints nothing.
- Pure function over a stream of `(timestampMs, dB)` samples → unit-tested.

---

## 4. Session

- The parent starts a session from parent mode; the app itself opens on the calm Goodbye screen, so the child never starts one alone. Length: **10 min** default (setting: 5/10/15).
- Starting a session asks for the microphone, so the system dialog comes up in parent mode and never in front of the child. A refusal only means the session runs without listening: the pause game then ends its pauses on the timer and on the parent's button.
- Parent mode pauses the running session. The parent returns to it, or ends it there (`parent_exit`).
- Last minute: subtle visual countdown, a 3 pt bar at the top edge shrinking right to left, no sound.
- At end: **Goodbye screen** — character waves, parent-voice "Xayr!" recording (optional, recorded in Settings), then a static calm screen. Nothing on it is tappable except the parent gate. Until the character exists, a waving hand symbol stands in for it.
- New session only via parent mode. Optional setting: minimum break between sessions (default 30 min, 0 = off). It blocks starting a new session until it has passed, counted from the last session that ended by the timer.
- A session the app died in is closed at the next launch as `app_killed`, at its last logged event.

---

## 5. Parent mode details

### Card editor

- Take photo / pick from library → crop square. Optional.
- Type the word (any script, stored as typed).
- Record voice: hold-to-record, max 4 s, playback preview, re-record. Required: a card cannot be saved without it. Trim leading/trailing silence if feasible; otherwise skip in v0.1.
- Or import a ready audio file via `expo-document-picker` (m4a, wav, mp3); a file longer than 4 s is rejected with a hint.
- While the parent speaks, the microphone level is sampled ten times a second and stored with the card, so the editor draws the shape of the recording whenever the card is opened. Nothing of the child's voice is recorded here (see §3).
- Assign to board, set position.

### Sequence editor

- Add items in order: text + recording (+ optional symbol, + optional image).

### Settings

Cards per screen, debounce seconds, pause window seconds, rounds per game, detection margin dB, session length, min break, Pause game tab on/off, child's name (the subtitle on the start screen: "<name> bilan birga o'ynaymiz"), reward glow on/off, reward sparks on/off.

### How a session goes

A screen of its own, "Sessiya qanday o'tadi", on parent home right under the session panel and apart from the list of sections: it belongs to starting a session, not to managing content. On its own screen each part stands on a panel of its own; inside the onboarding it stays flat. It is the script the parent follows, and the same text is step 3 of the onboarding:

- A short model first: the app is not a toy for the child but a button between the child and the parent; the reward is not the sound but what the parent hands over, and the screen only makes the request visible.
- Then seven steps, each a heading and one or two sentences: **the moment** (start from a real want, two cards on the board: the thing and `yana`), **the place** (iPad on the table between you, Guided Access on, session started from parent mode, the thing in sight and not given yet), **you first** (modelling on, tap the card, say the word, hand over a small portion so the want comes back, 3–5 times), **the pause** (hold the thing, look at it, stay quiet 5–10 s; when the child pulls your hand, guide it gently to the card, and hand the thing over as soon as the card played), **less help** (day by day: hand → elbow → pointing → nothing; the first tap of the child's own may come on the third day or on the tenth), **sounds** (mark any sound near a card with the attempt corner, and never ask the child to say anything), **the end** (when the timer is up it is over; do not extend it, least of all when it went well).

The daily tip on parent home is one of these seven steps, a different one each day.

### Log

- Simple daily summary list: session count, request taps per card, pause filled / timeout ratio, parent-credited attempts.
- **Urinishlar**: the attempt recordings of the day, each with the word it belongs to — a card, or an item of the sequence in the pause game — the time and its length, playable by the parent.
- **Export** as CSV/JSON via share sheet, together with the attempt recordings. This is the only way data leaves the device.

---

## 6. Data model (SQLite)

```
boards(id, title, position, is_active, created_at)
cards(id, board_id, text, image_path, audio_path, audio_levels, position, is_archived, created_at)
sequences(id, title, is_active, created_at)
sequence_items(id, sequence_id, position, text, symbol, audio_path, image_path)
sessions(id, started_at, ended_at, end_reason)            -- timer | parent_exit | app_killed
events(id, session_id, ts, type, card_id, sequence_id, item_position, payload_json)
settings(key, value)
```

- Paths are relative to the app document directory. `cards.audio_path` is required, `cards.image_path` is optional.
- `cards.audio_levels` is the loudness of the parent's recording as a JSON array of numbers from 0 to 1, one per tenth of a second; null for cards recorded before it was kept.
- Cards are archived, never hard-deleted, so old events keep their references.

### Event types

`session_start`, `session_end`, `request_tap`, `request_tap_model`, `request_tap_debounced`, `request_verbal_attempt`, `attempt_recorded`, `pause_open`, `pause_filled`, `pause_timeout`, `pause_parent_credit`, `game_start`, `game_round_end`, `parent_gate_open`, `tab_switch`.

`request_tap_debounced` matters: a high count on one card means he is looping on it, which is a signal to change the card or the debounce.

`game_start` is logged when the play button of the pause game is pressed; payload `{round}` is the round it starts, so a game picked up again after a tab switch is visible.

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
- iPhone vs iPad: a bigger, shared screen on a table is better for co-play if an iPad is available. The app runs on both in any orientation (the grid turns sideways in landscape); which one works better is still to observe.
