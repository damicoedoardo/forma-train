---
type: conceptual
title: Product overview
description: Forma is a calm, premium training app: an AI coach plans your week from how you really train, you log sets fast, and friends cheer you on.
tags: [product, overview]
timestamp: 2026-11-11
---

# Product overview

Forma is a training app with an AI coach at its heart. You tell the coach where you start and
what you want; it plans your week, watches how each workout really went (reps, how hard each set
felt, how long it took) and changes the plan with you. Logging a set is two taps. Friends see
who is training, cheer each other on mid-workout, and share finished workouts.

It lives on the phone: opened in a browser, it first asks to be added to the Home Screen, with
the steps for that phone (a computer can go on in the browser). Installed, it opens on the
sign-in (an emailed code, or Google), and works offline at the gym once signed in. It is built for Edoardo
first, then friends.

## The four tabs

- **Today**: the next workout and Start, the week at a glance, the coach's one line.
- **Coach**: the week (this one and the next) and the chat that changes it.
- **Friends**: who is training now (Cheer), friends, and the feed of shared workouts.
- **You**: your profile, your numbers and past workouts.

## Where it came from

Forma is the training half of FORMA (`damicoedoardo/calisthenics-quest`), a training app played
like a pixel RPG. This app keeps the coach, the workout flow, the exercise library and the social
side, and leaves the game behind: no XP, levels, story, the Fog, gear, parties or voice. The port
plan is the doc "Training app porting plan"; the screens are the canvas "Training app screens".

**Status (2026-11-10):** the whole app runs on the phone: the six-question setup, Today, the
workout, the screen after it, the coach's week, and You. The coach chat, friends, cheers, the
feed and the backup need sign-in, which waits on Supabase and the server (not set up yet).
