---
type: reference
title: The look
description: Forma's dark glass look — the color tokens, type, surfaces, buttons and tab bar, where each lives (tailwind.config.ts, globals.css, src/ui/), and the rules that keep it calm.
tags: [ui, design, tokens, tailwind]
timestamp: 2026-11-02
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
| `accent-glow` | `#494FDF` | The soft light behind a screen (`Glow`) |
| `rounded-card` / `rounded-pill` | 24px / full | Cards / buttons and the tab bar |

## Type

Inter for text, Inter Tight (`font-display`) for headings and big numbers. Weights 400 and 500
only: headings are medium, never bold. Big numbers (reps, the workout clock) are Inter Tight 400
with tight tracking.

## Surfaces and parts (`src/ui/`, `.glass` in `globals.css`)

- `Glass`: the one surface, white at 4.5% with a 6.5% hairline and a 20px blur. Depth comes from
  layering glass over the base and the glow, not from shadows.
- `Button`: a 56px pill. `primary` (ink on base) is the one main action of a screen; else `glass`.
- `Segmented`: choices in one glass tray (how a set felt, how the workout felt).
- `Glow`: one soft blue light per screen, at 20% opacity.
- `TabBar`: floating glass pill, four icons (lucide), the open one lit.

## Rules

- One primary button per screen. Little text: a label is a word or two.
- Touch targets at least 44px. Text at least 4.5:1 on the base.
- Respect `prefers-reduced-motion` (`globals.css` stills all motion).
