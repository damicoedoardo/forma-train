---
type: reference
title: The look
description: Forma's dark glass look — the color tokens, type, surfaces, buttons and tab bar, where each lives (tailwind.config.ts, globals.css, src/ui/), and the rules that keep it calm.
tags: [ui, design, tokens, tailwind]
timestamp: 2026-11-10
---

# The look

Dark, calm, glassy, minimal, in the spirit of Revolut. Agreed with Edoardo on 2026-11-02 on the
canvas "Training app screens". A louder pass (italic serif, mono labels, extra glows) was tried
and rejected: **restraint is the look**.

## Tokens (`tailwind.config.ts`)

| Token | Value | Use |
|---|---|---|
| `base` | `#0D0E12` | The background. A cool charcoal, never pure black |
| `ink` | `#ECECEF` | Text and the primary button. Never pure white |
| `ink-soft` / `ink-muted` / `ink-faint` | `#B4BAC0` / `#8D969E` / `#7C7C85` | Secondary text, quieter labels |
| `accent` | `#6E74F0` | The one accent: today, the active set, a live dot. Never for text blocks |
| `accent-iris` | `#A78BF5` | Where the accent runs to: the ring's lit part goes from blue to iris, and a faint iris light sits low behind a screen |
| `accent-glow` | `#494FDF` | The soft light behind a screen (`Glow`) |
| `win` / `win-soft` | `#E9B872` / `#F3D3A6` | A warm tone kept for wins: a new best, what went up. Small and rare, never for anything else |
| `rounded-card` / `rounded-pill` | 24px / full | Cards / buttons and the tab bar |

## Type

Inter for text, Inter Tight (`font-display`) for headings and big numbers. Weights 400 and 500
only: headings are medium, never bold. Big numbers (reps, the workout clock) are Inter Tight 400
with tight tracking.

## Surfaces and parts (`src/ui/`, `.glass` in `globals.css`)

- `Glass`: the one surface, lit from above: white from 6% down to 3.5%, a 6.5% hairline, a thin
  line of light on the top edge, and a 20px blur. Depth comes from
  layering glass over the base and the glow, not from shadows.
- `Button`: a 56px pill. `primary` (soft white, lit from above, a little lifted: `.btn-primary`)
  is the one main action of a screen; else `glass`.
- `Segmented`: choices in one glass tray (how a set felt, how the workout felt).
- `Glow`: one soft blue light per screen, at 20% opacity, and a fainter iris one (9%) low on the
  other side, so the dark has a little color to it.
- `TabBar`: floating glass pill, four icons (lucide), the open one lit.
- `Screen`: a full screen with its glow, safe-area padding and room for the tab bar. `Label` is a
  small muted heading; `Chip` a small pill to tap (a quick reply, a setup choice).
- `Stats`: a row of big numbers with a word under each (sets, this week, streak).
- `Avatar`: a round photo, or the initials on one of four quiet tones.
- Sheets (add a friend, cheer, edit profile, close a workout) slide up over a dim backdrop on a
  near-opaque glass card.

## The ring (`src/ui/Ring.tsx`)

Forma's one signature shape, added 2026-11-10. A circle cut into segments, one per set: done
ones are ink, the one you are on is the accent (a gradient, blue to iris), the rest wait. It
holds the rep counter in the workout, drains as the rest clock, closes in ink on the screen
after, counts the week's workouts next to the title on Today (68px), and is the app icon
(`public/icon-*.png`, five segments). `flash` gives it one pulse of warm light (a new best). Use it only for progress you can count; never as decoration.

## Motion (`globals.css`)

Quiet and short. A screen's parts rise in one after another (`.rise`, set by `Screen`, replayed
when its `view` changes). The lit pill in `Segmented` and the lit circle in `TabBar` slide.
Anything pressed gives a little (`.press`). A changed number pops (`.pop`). Sheets slide up
(`.sheet` over `.fade`). The glow breathes over nine seconds. A logged set gives a short buzz
where the phone allows. A new best gets a moment: the number glows warm while you are ahead of
last time, and once logged the rest ring pulses once (`.best-halo`, `.best-num`). The last three
seconds of rest pop; the end of rest buzzes and rings a soft two-note chime
(`src/platform/chime.ts`).

## Rules

- One primary button per screen. Little text: a label is a word or two.
- Touch targets at least 44px. Text at least 4.5:1 on the base.
- Respect `prefers-reduced-motion` (`globals.css` stills all motion).
