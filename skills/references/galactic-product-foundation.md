# Galactic Product Foundation

This is the public reference file for Galactic product and design skills. It contains stable, shareable conclusions about Galactic's users, wedge, and product principles without exposing raw research notes.

## Product Wedge

Galactic helps developers manage multiple projects, branches, environments, and AI coding agents without losing flow.

The sharpest wedge is developers running parallel worktrees or parallel AI-assisted workflows who hit infrastructure friction such as:

- port conflicts
- config or environment drift
- tool collisions between parallel workspaces
- uncertainty about whether a setup is trustworthy or supported

Galactic should be framed as a productized workflow advantage, not as a generic infrastructure toolbox.

## Primary User Archetypes

### Parallel Power User

- Mid-level to senior engineer
- Already running several worktrees or agent sessions in parallel
- Comfortable with CLI tools, editors, and custom setup
- Usually does not need education; needs proof that Galactic is simpler and more reliable than current scripts or tooling

### Aspiring Parallel User

- Engineer, student, or hobbyist trying to grow into parallel AI workflows
- Less confident with setup and environment management
- Needs clarity, trust, and safer defaults before they will adopt a new workflow

### Competing Builder

- Developer already building scripts or tools in the same space
- Evaluates Galactic through the lens of differentiation and defensibility
- Important for positioning, but not usually the first design target

## Core Pains

Treat these as the main problem buckets Galactic can legitimately address:

- `port conflicts`: multiple services or workspaces fighting for the same ports
- `config/env drift`: shells, tools, or workspaces silently using the wrong config
- `mechanism confusion`: users do not understand how Galactic's routing or environment behavior works
- `tool compatibility doubts`: users are unsure whether Galactic will work with their editor, browser automation, or existing workflow
- `trust/provenance barriers`: users hesitate to adopt a tool they cannot quickly verify or trust

## Adjacent But Not Primary

These pains matter in the market, but skills should keep them out of scope unless the prompt explicitly centers them:

- `merge conflicts`
- `orchestration`
- `notifications`
- `memory between agents`

## Positioning Guidance

- Prefer outcome language over infrastructure language.
- Emphasize "less manual setup" and "less workflow friction" over implementation details.
- For advanced users, prove Galactic is better than DIY.
- For less technical users, reduce fear and ambiguity before adding power features.
- When possible, show that Galactic removes repeated setup work across workspaces and agents.

## UX/UI Guidance

- Design for progressive disclosure.
- Power users should see fast proof, leverage, and control.
- Aspiring users should see clearer language, guided actions, and trust cues.
- Do not force users to learn internal architecture terms when a user-outcome phrase is clearer.
- Reveal technical details only when they help the user act, debug, or trust the feature.

## Product Decision Rules

- Prefer the current implementation over stale messaging if they conflict.
- Do not claim Galactic solves adjacent problems unless the feature actually does.
- Keep the recommended wedge narrow and sharp instead of broad and vague.
- Separate what Galactic solves today from what is only a future opportunity.
