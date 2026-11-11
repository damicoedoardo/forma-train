---
type: conceptual
title: Coach
description: How the coach plans and talks — setup, the built-in planner, the laws, the week, the brief sent to the LLM, the phone-side tools and the chat relay.
tags: [coach, llm, planner, laws, brief, tools]
timestamp: 2026-11-11
---

# Coach

`src/features/coach/` is the planner and the chat. Everything that decides a workout runs on the
phone, so the coach works offline with the built-in planner, and the LLM only talks and calls
tools.

## The parts

- **Setup** (`setup.ts`, `setupChat.ts`, `levels.ts`): the answers from the first chat become the coach profile.
- **Planner** (`generate.ts`, `craft.ts`, `staples.ts`, `options.ts`, `search.ts`, `time.ts`):
  builds a workout like a trainer would (warm-up, main lifts, accessories, core, cool-down) that
  fits the minutes. `craft.ts` holds the playbook the `training_guide` tool returns.
- **Laws** (`laws.ts`, `validate.ts`): the few rules every saved workout must keep (warm-up
  first, never to failure, nothing on a sore spot, set caps, a rest day every week, and more).
  A tool that would break one answers "Not saved".
- **Week** (`week.ts`, `plan.ts`): this week and next, Monday to Sunday. `weekRing` counts this
  week's workouts done of planned, for the ring on Today. A day without a workout
  is a rest day; `restKept` reads `state.rested`.
- **Brief** (`brief.ts`, `notes.ts`, `nudge.ts`, `feedback.ts`): one short plain-text page about
  the person, rebuilt from the save on every message.
- **Tools and chat** (`tools.ts`, `chat.ts`, `client.ts`): `askCoach` sends the brief and the
  chat to `POST /coach`; tool calls come back and run on the phone (`runTool`), and their
  results go out with the next call. A turn is at most `MAX_ROUNDS` (8) calls; the last is sent
  with `final`, so the api asks the model for words only (`tool_choice: none`), and a turn never
  ends in silence (`STUCK` if it still says nothing). Offered replies (`suggest_replies`) end the
  turn only once the coach has said something. The save keeps the last `TURNS_KEEP` (10)
  exchanges whole, capped at `CHAT_KEEP` (100) messages (`trimChat`), and `shownChat` keys each
  line by what it says, so trimming never redraws the chat.
- **Numbers** (`config.ts`): rest, ramp, time and cool-down defaults.
- **Titles** (`title.ts`): `shortTitle` ("Pull, push, squat") and `titleKind` ("Calisthenics")
  split a built-in title for screens.
- **Screens** (`ui/`): `Setup.tsx` is the first open, a short chat with the coach: six questions
  (name, what you train, what for, days, minutes, gear), each answered with one tap (name is
  typed; what you train and gear take several taps, then Done). The coach "types" for a moment
  and says a word back before the next one; its lines and the options live in `setupChat.ts`.
  The answers go into `quickAnswers` and `applySetup`; the rest of the profile starts in the
  middle and the coach learns it. `CoachTab.tsx` is the Week and the Chat (the tab is locked to the phone's height: only the week or
  the chat list scrolls, and the message bar rides on the keyboard). Its "This week" count is
  `weekTally`, which falls back to the days a week picked at setup. `useCoach.ts`
  keeps two weeks planned (`useCoachPlan`), lets the coach replan a due week on its own once
  signed in (`useCoachAutoPlan`), and runs the chat (`useCoachChat`). While the coach works, the
  chat shows a small `CoachOrb` weaving beside the current tool step.
- **Dictation** (`ui/useDictation.ts`, `app/api/voice/transcribe/route.ts`): the mic in the
  message bar records (a moving line of your voice and a timer, X to drop it, a tick to keep
  it); the audio goes to the app's own server route, which asks Deepgram Nova-3 and sends back
  the words. They land in the box after anything typed, to edit or send. The route needs
  `DEEPGRAM_API_KEY` (else 503) and a signed-in caller once Supabase is set up; before that it
  answers only with `VOICE_OPEN=1`. The box grows to five lines; Enter sends.
- **Demo** (`ui/demo.ts`): open the app with `?sandbox&demo` and the chat runs on a made-up coach
  (`demoAsk`: a short script that calls real read-only tools, nothing sent to the server).

## The voice

The fixed rules live in `backend/app/coach.py` (`SYSTEM`): a calm, warm, direct trainer, short
messages, no body talk, honest about the log. There is no persona or story. The server's tool
list must match what `runTool` handles; `craft.test.ts` checks that.
