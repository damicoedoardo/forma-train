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

- **Setup** (`setup.ts`, `levels.ts`): the answers from the first chat become the coach profile.
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
  results go out with the next call.
- **Numbers** (`config.ts`): rest, ramp, time and cool-down defaults.
- **Titles** (`title.ts`): `shortTitle` ("Pull, push, squat") and `titleKind` ("Calisthenics")
  split a built-in title for screens.
- **Screens** (`ui/`): `Setup.tsx` is the first open, six questions (name, what you train, what
  for, days, minutes, gear) into `quickAnswers` and `applySetup`; the rest of the profile starts
  in the middle and the coach learns it. `CoachTab.tsx` is the Week and the Chat. `useCoach.ts`
  keeps two weeks planned (`useCoachPlan`), lets the coach replan a due week on its own once
  signed in (`useCoachAutoPlan`), and runs the chat (`useCoachChat`). While the coach works, the
  chat shows a small `CoachOrb` weaving beside the current tool step.
- **Mockup** (`ui/demo.ts`, `ui/Voice.tsx`): open the app with `?sandbox&demo` and the chat runs
  on a made-up coach (`demoAsk`: a short script that calls real read-only tools, nothing sent to
  the server). In it the main button of the message bar is a voice button while the bar is empty;
  it opens `Voice`, a scripted voice exchange (listening, tool steps, talking, with captions).
  No microphone or speech is wired yet.

## The voice

The fixed rules live in `backend/app/coach.py` (`SYSTEM`): a calm, warm, direct trainer, short
messages, no body talk, honest about the log. There is no persona or story. The server's tool
list must match what `runTool` handles; `craft.test.ts` checks that.
