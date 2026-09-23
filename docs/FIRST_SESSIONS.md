# The first weeks with the child

For the parent running the app, not for the developer. The app itself carries the session script in Uzbek
("Sessiya qanday o'tadi" on parent home, and step 3 of the onboarding); this is what surrounds it — how to set the
device up, what to watch, what to change and when to leave things alone.

What success looks like after about four weeks, from SPEC:

- he taps cards to ask instead of, or as well as, leading an adult by the hand;
- he makes sounds in the pause windows more often than in the first week;
- with luck, word approximations start to appear around the request cards.

Nothing else is a result. A quiet session is not a failure, and a session where he only watched is data too.

## Before the first session

On the device:

1. Install the app (Expo Go for now, TestFlight later) and open it. The onboarding asks for two cards.
2. **Guided Access**: Settings → Accessibility → Guided Access, on. Start it in the app with a triple-click of the side
   button, and switch Motion off in its options to lock the rotation. Without it, the child leaves the app in a second.
3. Allow the microphone when the app asks. It asks when you start the first session, in parent mode, never in front of
   the child.

In parent mode:

- **Two cards to begin with**: the thing he actually wants right now (`suv`, `multfilm`, `arg'imchoq`) and `yana`.
  A real photo of his own cup, his own swing — not a picture from the internet. Your voice, one word, calm, no
  question in it.
- **The child's name** in settings, for the start screen.
- **"Xayr!" in your voice** in settings, so the session has an ending he can hear.
- **A sequence** for the pause game, once the board works: something he already says or recites by heart, `bir, ikki,
  uch, to'rt, besh`. Each item needs your voice; the digit above the word is optional and he will like it. The game
  stays off in settings until you want it.

## Running a session

The script is in the app; read it once before the first time. The short version: start from something he wants, sit
beside him with the iPad on the table, model it yourself three to five times, then hold the thing and stay quiet for
five to ten seconds. When he pulls your hand, guide it gently to the card. **Hand the thing over the moment the card
has spoken** — that is the whole loop, and the app is only the middle of it.

The two faint corner buttons are yours: the bubble on the left credits a sound he made (hold it to record the sound
itself), the hand on the right turns on modelling, which marks the taps you make yourself so they do not count as his.

Do not ask him to say anything. Do not repeat "say it". Do not extend a session that is going well — the timer ending
while he still wants more is exactly right.

## What to change, and when

Change one thing at a time, and give it two or three sessions before judging it.

| What you see | Setting | Which way |
| --- | --- | --- |
| He taps the same card over and over for the sound | Debounce seconds | Up (12, 16) |
| He waits for the card to be tappable again and loses interest | Debounce seconds | Down (4) |
| Too much on the board, he sweeps across it | Cards per screen | 2 |
| He hunts for a card that is not there | Cards per screen | 4 or 6, add the card |
| He starts to answer only after the app has moved on | Pause window seconds | Up (8) |
| He loses the thread while nothing happens | Pause window seconds | Down (3) |
| The game counts sounds that are the chair, not him | Detection margin dB | Up (15) |
| He makes a quiet sound and nothing happens | Detection margin dB | Down (9, 6) |
| The game ends before he warms up | Rounds per session | 8 |
| He is tired of it by the third round | Rounds per session | 3 |
| Sessions end in tears or boredom | Session length | 5 min |
| He asks for the app all day | Minimum break | 30 or 60 min |

The reward glow and the sparks are settings too. If they pull him away from the parent — if he starts playing for the
animation — turn them off.

## The diary

**Kundalik** in parent mode:

- the week strip: how many taps on each of the last seven days, so a good week and a lost one are visible at a glance;
- today: sessions, taps, and sounds credited or recorded;
- the pause game: how many pauses were filled out of how many opened;
- taps per card, most played first — this is the vocabulary he is actually using;
- a warning when one card was tapped five times or more while the app was ignoring repeats. That is a loop, not a
  request: change the card, raise the debounce, or end the session;
- **Urinishlar**: the sounds you recorded, by day, playable. Worth listening to a week apart — this is where a word
  approximation shows up first, long before anyone can be sure of it.

Keep in mind that the app cannot tell a request from an experiment. The numbers say what happened, not what it meant;
you say what it meant.

## Export, and clearing

The export button in the diary puts everything in one zip through the share sheet: the events as a spreadsheet, the
sessions, the settings, the cards and sequences, and the attempt recordings as files. It is the only way anything
leaves the device. Send it to yourself before showing the log to anyone — a speech therapist reads "taps per card over
four weeks" better than any description.

"Kundalikni tozalash" in settings deletes the diary and the recorded attempts, and keeps the cards. Use it after an
export, or whenever the recordings of his voice have served their purpose. Nothing here goes to any server: there is no
account, no analytics and no network.

## When it does not work

- **He ignores the cards.** Then the moment was wrong, not the app: start from a want that is real and immediate, and
  model more yourself. Two cards, not six.
- **He plays with the app as an app.** Turn the reward animation off, shorten the session, and make sure every tap ends
  with you handing something over.
- **He never fills a pause.** Lower the detection margin, use the bubble button yourself for anything he does, and use
  a sequence he knows so well that the missing word pulls at him.
- **Nothing for two weeks.** That is within normal. Keep the sessions short, keep the log, and take the export to the
  speech therapist — the question of what to try next is theirs, not the app's.
