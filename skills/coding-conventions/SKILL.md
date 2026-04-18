---
name: coding-conventions
description: Applies the client-side subset of Galactic engineering rules. Use when writing, reviewing, or modifying React/TypeScript renderer code and you want the UI conventions without loading the broader repo framing.
allowed-tools: Read, Grep, Glob, Write, Edit
---

# Coding Conventions

Use this as the client-focused alias for `$galactic-engineering`.

Read `../galactic-engineering/SKILL.md` first, then focus on the renderer-specific parts of those rules.

## Scope

- Use this skill for React/TypeScript UI work in `src/`.
- Apply the repository-wide testing and versioning rules from `$galactic-engineering`.
- Enforce the UI-specific conventions for shadcn/Tailwind, toasts, TypeScript, path aliases, storage, OS-aware logic, and git service boundaries.

## Hard Rules

- Treat `$galactic-engineering` as the canonical source of truth.
- If instructions overlap, follow `../galactic-engineering/SKILL.md`.
- Do not duplicate the full convention set here again.
