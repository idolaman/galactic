---
name: galactic-user-insight-brief
description: Creates a Galactic-specific user insight brief for a feature, workflow, or product area. Use when you need to identify the target user, JTBD, current workaround, trust requirements, and adoption blockers before gap analysis or design.
allowed-tools: Read, Grep, Glob
---

# Galactic User Insight Brief

Use this skill to ground a Galactic product discussion in real users before proposing gaps, specs, or design.

## Required Context

Read these first:

- `../references/galactic-product-foundation.md`
- `README.md`
- Any user-supplied local artifact relevant to the prompt, such as gap notes or screenshots

If the prompt targets an existing feature, inspect the relevant implementation and tests in `src/`, `electron/`, and `tests/` before concluding.

If the current branch or code disagrees with older messaging in docs, prefer the live implementation and call out the delta.

## Working Model

Always classify the request against Galactic's observed users:

- `parallel power user`: already running 3+ parallel agent sessions; wants leverage, proof, and less infrastructure friction
- `aspiring parallel user`: trying to level up; needs clarity, trust, and safer onboarding
- `competing builder`: already building or scripting adjacent tooling; cares about differentiation and defensibility

Always classify the dominant pain:

- `port conflicts`
- `config/env drift`
- `mechanism confusion`
- `tool compatibility doubts`
- `trust/provenance barriers`

Treat these as adjacent unless the prompt explicitly centers them:

- `merge conflicts`
- `orchestration`
- `notifications`

## Workflow

1. Identify the feature, workflow, or product area under discussion.
2. Read the product foundation and map the request to one primary archetype.
3. Confirm the current product surface from `README.md` and relevant code.
4. Infer the user's current workaround or fallback behavior.
5. Extract the trust bar, proof bar, and adoption blocker for this request.
6. Choose the next skill that should consume the brief.

## Hard Rules

- Do not write a generic persona deck. Tie every claim to Galactic's actual audience and product.
- Pick one primary archetype. You may mention a secondary archetype only if it materially changes the recommendation.
- Keep the brief product-facing. Do not drift into implementation details or UI layout proposals.
- Separate the pain Galactic should solve now from adjacent pain Galactic merely touches.
- If evidence is weak, say so and lower confidence instead of inventing certainty.

## Output

Return exactly this Markdown structure:

```md
# User Insight Brief

## Request
- Feature or workflow:
- Current product area:

## Target Archetype
- Primary archetype:
- Secondary archetype:
- Workflow maturity:

## Job To Be Done
- Core job:
- Desired outcome:
- Why this matters now:

## Current Workaround
- What the user likely does today:
- Why that workaround is good enough today:
- Where it breaks:

## Top Pains
- Dominant pain:
- Supporting pains:
- Explicitly out-of-scope adjacent pains:

## Trust And Proof Requirements
- What this user needs to believe:
- What proof or demo would reduce doubt:
- Trust barrier:

## Adoption Blockers
- Primary blocker:
- Secondary blockers:

## Evidence
- Signals from `../references/galactic-product-foundation.md`:
- Signals from `README.md` or implementation:

## Confidence
- Confidence:
- What is still unknown:

## Next Recommended Skill
- Next skill:
- Why this handoff is next:
```

Hand off to `$galactic-feature-gap-analysis` unless the prompt is only asking for user understanding.
