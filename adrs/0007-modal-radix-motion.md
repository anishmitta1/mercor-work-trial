# 0007 — Modal: Radix Dialog for behavior + motion for animation

Status: accepted · 2026-08-07

## Context

Widget editing needs real estate: a card that expands into a dialog. Two hard problems appeared:
(1) hand-rolled FLIP animation was janky (layout thrash, transform-centering snap, no interruption
handling); (2) modal accessibility — focus trap, focus return, Esc, scroll lock, aria — is
bug-prone when hand-rolled (we shipped and then fixed focus-stranding bugs).

## Decision

A `Modal` primitive composing both libraries: Radix Dialog owns behavior (focus into the dialog
on open, return on close, Esc, scrim, scroll lock, aria, SR-only title); motion's `layoutId`
shared-element transition owns the morph (card rect ↔ dialog, cubic-bezier(0.32, 0.72, 0, 1),
450ms, symmetric enter/exit). Centering uses layout (margin-inline auto), never transforms —
transforms fight layoutId.

## Consequences

- The primitive knows nothing about widgets; any component can morph into a dialog.
- Content rides the morph at 80% opacity, settling to 100% — masks the two-sided transition.
- Hand-rolled animation/a11y code (~90 lines) deleted.
