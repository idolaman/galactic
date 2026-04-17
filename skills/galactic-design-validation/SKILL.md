---
name: galactic-design-validation
description: Critiques a Galactic UX/UI spec before engineering handoff. Use when you need a structured validation pass focused on clarity, trust, compatibility risk, edge cases, and whether the design actually serves Galactic's target users.
allowed-tools: Read, Grep, Glob
---

# Galactic Design Validation

Use this skill to pressure-test a Galactic design before it becomes handoff material.

## Required Context

Read these first:

- `../references/galactic-product-foundation.md`
- `README.md`
- The latest `Solution Brief`
- The latest `UX/UI Spec`

Inspect relevant implementation only when needed to verify compatibility or surface mismatch.

## Workflow

1. Re-state the primary user and dominant pain.
2. Check whether the design solves that problem cleanly.
3. Look for technical leakage, vague states, unsupported promises, and trust gaps.
4. Evaluate tool and workflow compatibility concerns likely to matter to Galactic users.
5. Check edge cases and degraded states.
6. Decide whether the design passes or requires revision.

## Hard Rules

- Findings come first. Do not lead with a summary.
- Be specific about why a design is risky for Galactic's users.
- Flag any place where the design overpromises beyond current product capability.
- Treat trust and proof gaps as first-class design failures when the audience requires them.
- If the design is acceptable, still name residual risks instead of pretending it is perfect.

## Output

Return exactly this Markdown structure:

```md
# Design Validation Report

## Findings
| Severity | Finding | Why It Matters |
| --- | --- | --- |
| Blocking / Major / Minor |  |  |

## Clarity Risks
- Risk:

## Trust Risks
- Risk:

## Tool And Workflow Compatibility Risks
- Risk:

## Edge Cases
- Case:

## Accessibility And Comprehension Checks
- Check:

## Required Revisions
- Revision:

## Decision
- Pass or revise:
- Reason:
```

If the decision is `Revise`, hand back to `$galactic-ux-ui-feature-design`. If the decision is `Pass`, hand off to `$galactic-design-handoff`.
