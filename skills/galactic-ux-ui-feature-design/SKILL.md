---
name: galactic-ux-ui-feature-design
description: Produces a Galactic UX/UI spec from a solution brief. Use when you need concrete flows, interface states, trust cues, copy direction, and progressive disclosure for power users and aspiring users.
allowed-tools: Read, Grep, Glob
---

# Galactic UX/UI Feature Design

Use this skill to turn a Galactic solution brief into a design-ready experience specification.

## Required Context

Read these first:

- `../references/galactic-product-foundation.md`
- `README.md`
- The latest `Solution Brief`

Inspect the current feature surfaces in the repo before proposing changes so the design fits Galactic's product reality.

## Design Lens

Design for progressive disclosure:

- power users want fast proof, leverage, and minimal ceremony
- aspiring users want clearer language, confidence, and safer defaults

Prefer outcome language over infrastructure language. Expose technical detail only when it helps the user act.

## Workflow

1. Define the entry point and trigger for the feature.
2. Write the primary user flow in sequence.
3. Add the power-user path and aspiring-user path when they meaningfully differ.
4. Define every important state: default, loading, success, error, empty, blocked, and degraded.
5. Specify trust cues, copy guidance, and proof points the interface must surface.
6. Note where the design intentionally hides or reveals technical detail.
7. End with design risks that should be checked before handoff.

## Hard Rules

- Do not design generic SaaS UI. Design for Galactic's developer workflows.
- Avoid surfacing internal architecture unless it improves trust or control.
- Include mechanism explanation when confusion is a likely blocker.
- Include compatibility reassurance when the user may doubt support for their tools.
- Keep adjacent pain separate; the design should not pretend to solve merge conflicts or orchestration unless explicitly asked.

## Output

Return exactly this Markdown structure:

```md
# UX/UI Spec

## Entry Points
- Primary entry point:
- Supporting entry points:
- Trigger moment:

## Primary Flow
1. Step 1:
2. Step 2:
3. Step 3:

## Audience Paths
- Power-user path:
- Aspiring-user path:

## Screen And State Inventory
| Surface or State | Purpose | Key Elements |
| --- | --- | --- |
|  |  |  |

## Interaction Rules
- What the user can do:
- What the system must confirm:
- What stays hidden by default:

## Copy And Trust Cues
- Headline or framing guidance:
- Mechanism explanation:
- Compatibility reassurance:
- Trust/provenance cue:

## Error, Empty, Loading, And Success States
- Loading:
- Empty:
- Error:
- Success:
- Blocked or degraded:

## Open Design Risks
- Risk 1:
- Risk 2:
- Risk 3:
```

Hand off to `$galactic-design-validation`.
