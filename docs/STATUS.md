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
| 5 | First EAS build → TestFlight | prepared, not built |
| 6 | Sequence editor + pause game | done |
| 7 | Vocalization detector + microphone | done, waiting for a device check |
| 8 | Diary and export | done |

Outside the numbering: the design pass against `docs/design/*.png` (tokens, Manrope, medallion icon and splash),
onboarding, the session-guide screen, attempt recordings, audio import, and a full audit of the app.

Step 5 is deliberately early in the spec and is the next thing that matters: what the child does with the request
board changes the rest of the plan. It needs an Apple Developer Program membership; everything else is ready
(`eas.json`, icon, splash, bundle identifier).

## In flight

Branch `feat/detector-baseline`, not merged:

- the detector listens from the first reading of a pause window against the last known baseline; the 500 ms measured
  at the opening may only lower it; a pause that ran out hands its last 500 ms on as the room;
- stray recorder takes are deleted at start-up;
- a development build logs the baseline, the threshold and the peak of every hearing;
- rounds per game became a setting (3/5/8) and the Ketma-ketliklar screen says the number;
- a one-second breath after the item a pause was about;
- clearing the diary (always) and a full reset (development builds only);
- the shape of a sequence item's recording is stored (migration 5).

It waits on a device check: the detector margin can only be chosen in the room the child is in.

## Decided along the way

- Touch targets: 120 pt is about what the **child** taps; the parent's corner controls on child screens are 44–56 pt on
  purpose, so he does not aim for them.
- Attempt recordings are the only audio of the child the app keeps, they are always started by the parent, and they are
  never played back to him.
- The mic listens in the pause window and during the quiet measurement before a game; the detector keeps metering only.
- After the five (or three, or eight) rounds the game tab goes quiet until the next session, and the play button says
  so by being grey and doing nothing.

## Open questions

- The margin in dB, the pause window and the debounce are all guesses until the first week of real use.
- Does the greyed hint word in a pause help, or does it invite reciting? (SPEC §8.)
- Does the enlarged card help, or does he try to dismiss it? (SPEC §8.)
- The export caps attempt recordings at 10 000, which nobody will reach; if it ever matters, page it.

## Deliberately not built

Letters and numbers teaching, animal vocabulary, an animated character, lip-sync, several children, cloud sync,
Android, the App Store, anything with an LLM in it. A speech recogniser — the app detects that the child made a sound,
never what he said.
