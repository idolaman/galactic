---
name: galactic-design-handoff
description: Packages an approved Galactic UX/UI design into a design-ready handoff for future engineering skills. Use when solution framing, design, and validation are complete and you need one final artifact with behavior, states, acceptance criteria, instrumentation, and open risks.
allowed-tools: Read, Grep, Glob
---

# Galactic Design Handoff

Use this skill to consolidate approved product and design decisions into a clean handoff artifact for future engineering work.

## Required Context

Read these first:

- `../references/galactic-product-foundation.md`
- `README.md`
- The latest `Solution Brief`
- The latest `UX/UI Spec`
- The latest `Design Validation Report`

If the validation report does not explicitly pass the design, stop and say the handoff is blocked pending revision.

## Workflow

1. Reconfirm the approved user goal and scope.
2. Convert the UX/UI spec into behavior-level requirements.
3. Compile the full state matrix and acceptance criteria.
4. Add instrumentation needs that product should measure after implementation.
5. Record dependencies and open risks without inventing engineering solutions.
6. Package the result as the canonical input for future engineering skills.

## Hard Rules

- Do not make new product decisions in the handoff.
- Do not introduce implementation detail that was not approved upstream.
- Keep requirements observable and testable from the user side.
- Call out open risks plainly so future engineer skills inherit the right caution.
- Preserve the distinction between primary user value and secondary nice-to-haves.

## Output

Return exactly this Markdown structure:

```md
# Design-Ready Handoff

## Final User Goal
- Primary user:
- User goal:
- Why this matters:

## Approved Behavior
- Behavior 1:
- Behavior 2:
- Behavior 3:

## State Matrix
| State | What The User Sees | Expected Outcome |
| --- | --- | --- |
|  |  |  |

## Acceptance Criteria
- Criterion 1:
- Criterion 2:
- Criterion 3:

## Instrumentation Needs
- Event or metric:
- Why it matters:

## Dependencies
- Dependency:

## Open Risks
- Risk:

## Future Engineer Skill Inputs
- What future engineering work should preserve:
- What engineering should not decide alone:
```

This artifact is the final output of the non-engineering suite.
