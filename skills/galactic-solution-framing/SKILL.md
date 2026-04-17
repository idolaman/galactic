---
name: galactic-solution-framing
description: Turns a Galactic gap analysis into a scoped product brief. Use when you need a decision-oriented solution framing artifact with scope, constraints, success metrics, and design questions before UX/UI work starts.
allowed-tools: Read, Grep, Glob
---

# Galactic Solution Framing

Use this skill to turn a diagnosed gap into a clear product bet for design.

## Required Context

Read these first:

- `../references/galactic-product-foundation.md`
- `README.md`
- The latest `Gap Analysis`

Inspect relevant code only as needed to confirm terminology, current behavior, and feature boundaries.

## Workflow

1. Start from the recommended primary gap.
2. Choose the single primary user this solution is for.
3. Define the product bet in user-outcome language.
4. Lock in scope boundaries so design does not sprawl.
5. Name the business, trust, or comprehension constraints that shape the solution.
6. Define success metrics and failure conditions that future design can optimize for.
7. End with concrete questions for the UX/UI skill.

## Hard Rules

- Solve one primary gap. Do not bundle multiple problems into the same framing.
- Phrase the bet in terms of user outcome, not internal architecture.
- Keep scope narrow enough that a designer can make concrete decisions.
- Include trust and proof requirements whenever the user analysis suggests skepticism or mechanism confusion.
- If current code or messaging is shifting, preserve the user outcome and avoid overcommitting to unstable implementation language.

## Output

Return exactly this Markdown structure:

```md
# Solution Brief

## Problem Statement
- Primary gap:
- Primary user:
- Why this matters:

## Product Bet
- Core bet:
- User outcome:
- Why Galactic can credibly solve this:

## In Scope
- Included behaviors:
- Included surfaces:

## Out Of Scope
- Explicitly excluded problems:
- Deferred ideas:

## Constraints
- Product constraints:
- Trust or proof constraints:
- Compatibility constraints:

## Success Metrics
- User-facing success signal:
- Product success signal:
- What would count as failure:

## Questions For Design
- Open question 1:
- Open question 2:
- Open question 3:
```

Hand off to `$galactic-ux-ui-feature-design`.
