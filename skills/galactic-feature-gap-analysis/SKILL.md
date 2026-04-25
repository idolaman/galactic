---
name: galactic-feature-gap-analysis
description: Analyzes an existing Galactic feature or workflow to find the highest-value product gaps. Use when you need a structured gap analysis grounded in real users, current implementation, and clear in-scope versus out-of-scope pain.
allowed-tools: Read, Grep, Glob
---

# Galactic Feature Gap Analysis

Use this skill to diagnose where an existing Galactic experience falls short for real users.

## Required Context

Read these first:

- `../references/galactic-product-foundation.md`
- `README.md`
- A `User Insight Brief` when available
- Any prompt-specific artifacts such as `UXgaps.md`, screenshots, or notes

Inspect the current experience in code and tests before naming a gap. For product surfaces, search the relevant paths in `src/`, `electron/`, and `tests/`.

## Workflow

1. State the feature or workflow being analyzed.
2. Reconfirm the primary user archetype and dominant pain.
3. Describe the current experience as it exists now, not as it was intended.
4. List observable gaps between the desired outcome and current experience.
5. Rank each gap by severity, frequency, and strategic fit for Galactic.
6. Separate true product gaps from adjacent but out-of-scope pain.
7. Recommend one primary gap for solution framing.

## Hard Rules

- Ground every claimed gap in evidence from the repo, the prompt, or `../references/galactic-product-foundation.md`.
- Prefer sharp product gaps over generic UX complaints.
- Call out non-gaps when the current product already does something adequately.
- Do not let merge conflicts, orchestration, or notifications hijack the analysis unless the prompt explicitly asks for them.
- If the feature language is stale, note the terminology mismatch as a gap only when it affects comprehension or adoption.

## Output

Return exactly this Markdown structure:

```md
# Gap Analysis

## Scope
- Feature or workflow:
- Current surface inspected:
- Primary archetype:
- Dominant pain:

## Current Experience
- What the user sees today:
- What the product is trying to achieve:
- Where the experience currently works:

## Observed Gaps
| Gap | Why It Matters | Severity | Frequency | Confidence |
| --- | --- | --- | --- | --- |
|  |  | High / Medium / Low | High / Medium / Low | High / Medium / Low |

## Who Feels This Most
- Primary affected user:
- Secondary affected user:

## Non-Gaps
- What should not be changed:

## Adjacent But Out Of Scope
- Adjacent pain:
- Why it is not the primary gap:

## Recommended Primary Gap
- Primary gap to solve next:
- Why this is the right wedge for Galactic:
- Next skill:
```

Hand off to `$galactic-solution-framing`.
