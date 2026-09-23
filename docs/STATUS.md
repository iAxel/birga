# Status

Where the project stands. Update it when a step lands.

_Last updated: 2026-09-23._

## Build order (SPEC §7)

| # | Step | State |
| --- | --- | --- |
| 1 | Project, router, SQLite + migrations, theme | done |
| 2 | Parent mode: card editor (photo + text + voice) | done |
| 3 | Request board with debounce and the event log | done |
| 4 | Session timer, goodbye screen, parent gate | done |
| 5 | First EAS build → TestFlight | prepared, not built; the build also excludes the child's data from backups |
| 6 | Sequence editor + pause game | done |
| 7 | Vocalization detector + microphone | done; its baseline reworked in the audit, waiting for a device check |
| 8 | Diary and export | done |

Outside the numbering: the design pass against `docs/design/*.png` (tokens, Manrope, medallion icon and splash),
onboarding, the session-guide screen, attempt recordings, audio import, and a full audit of the app.

Step 5 is deliberately early in the spec and is the next thing that matters: what the child does with the request
board changes the rest of the plan. It needs an Apple Developer Program membership; everything else is ready
(`eas.json`, icon, splash, bundle identifier).

## In flight

The audit of 2026-09-23 is fixed on three branches, each on top of the one before, none merged into `main`. The work
the audit found before it (the detector's first baseline rules, rounds per game, clearing the diary, migration 5) is
already in `main`.

- `fix/audit-critical`: no recorder is ever left prepared, since expo-audio starts a prepared recorder by itself on the
  next return to the foreground; the detector measures the room only in the app's quiet moments, counts only a rise
  from below the threshold, never believes a room quieter than −70 dB and keeps the room between sessions; the screen
  stays on while the child plays.
- `fix/audit-high`: an event keeps the word it was about; no copy of the child's voice waits in the cache, and clearing
  the diary deletes earlier exports and stray takes; a round moves on only from the item it is on, and the app leaving
  the foreground stops the game; the play-button measurement runs only on screen; the game's words shrink to fit.
- `fix/audit-medium`: the attempt corner works the whole game and reads raw touches; modelling ends a minute after the
  parent's last tap; the diary's pause share, loop warning, midnight and CSV time; one transaction queue per
  connection; the session's own start and end times; no link opens a screen; the tab gap on a 375 pt iPhone; the
  microphone question; import without the microphone; saving media; other apps silenced; unused dependencies removed.

They wait on a device check before the merge, `fix/audit-critical` first: in the card editor, tap the record button
instead of holding it, lock and unlock the device, and see that no orange microphone dot appears. The raw touches of
the attempt corner and the detector's margin can only be judged on the device as well.

## Decided along the way

- Touch targets: 120 pt is about what the **child** taps; the parent's corner controls on child screens are 44–56 pt on
  purpose, so he does not aim for them.
- Attempt recordings are the only audio of the child the app keeps, they are always started by the parent, and they are
  never played back to him.
- The mic listens in the pause window and during the quiet measurements of the room, before a game and between
  rounds; the detector keeps metering only. A measurement never counts as the child, a pause counts only a rise from
  below the threshold, the baseline never goes below −70 dB, and it is kept in the settings between sessions.
- After the five (or three, or eight) rounds the game tab goes quiet until the next session, and the play button says
  so by being grey and doing nothing.
- An event about a card or a sequence item keeps the word, and an item's id, in its payload; the schema stays as it is.
- The attempt corner works through the whole pause game: in an open pause a tap ends it, at any other moment it is
  `pause_parent_credit` with `inPause: false` against the item said last.
- The diary's pause share is `pause_filled` / (`pause_filled` + `pause_timeout`): how well the detector hears the
  child. The parent's credits count among the attempts.
- `src/i18n/uz.ts` keeps its Russian comments; CLAUDE.md names the exception.

## Open questions

- The margin in dB, the pause window and the debounce are all guesses until the first week of real use.
- Does the greyed hint word in a pause help, or does it invite reciting? (SPEC §8.)
- Does the enlarged card help, or does he try to dismiss it? (SPEC §8.)
- The export caps attempt recordings at 10 000, which nobody will reach; if it ever matters, page it.

## Deliberately not built

Letters and numbers teaching, animal vocabulary, an animated character, lip-sync, several children, cloud sync,
Android, the App Store, anything with an LLM in it. A speech recogniser — the app detects that the child made a sound,
never what he said.
