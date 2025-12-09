---
name: coding-conventions
description: Enforces client coding conventions. Use when writing, reviewing, or modifying React/TypeScript code in the client/ directory. Ensures proper use of Tailwind/shadcn UI components, path aliases, TypeScript interfaces, icon usage, platform-safe storage/git logic, and consistent design system rules.
allowed-tools: Read, Grep, Glob, Write, Edit
---

# Client Coding Conventions (shadcn + Tailwind)

Apply these conventions when working on code in the `client/` directory.

---

## File Structure Rules

NEVER:
- Create `index.ts` or `index.tsx` files
- Use deep relative imports (`../../../components/...`)
- Mix logic, UI, and styling in the same file

ALWAYS:
- Import directly into component files
- Use path aliases (`@/`, `@components/`, `@pages/`, `@styles/`)
- Structure each component with `.tsx` plus colocated hooks/utilities only
- Follow the Single Responsibility Principle (SRP)

---

## File Size Rules

HARD LIMIT:
- No file should exceed ~140 lines of code

If a file approaches 140 lines, you MUST:
- Split logic into custom hooks or utilities
- Break UI into smaller sub-components
- Separate responsibilities strictly by SRP

A file larger than 140 lines is considered an architectural smell.

---

## Styling Rules (CRITICAL)

- Use Tailwind utilities and shadcn variants for all visual styling; avoid inline `style` except for CSS variables.
- Prefer `gap` for spacing between siblings; avoid `margin` for layout. Use padding only for container interior spacing.
- Avoid arbitrary pixel values. Stick to the Tailwind scale (rem-based). If a token is missing, request it rather than hard-coding.
- Keep styling inside `className` via `cn(...)`; do not use template string concatenation.
- Add custom CSS only when Tailwind/shadcn cannot express a requirement; use design tokens and CSS variables when doing so.

### Shadcn UI Components

- Prefer components from `@/components/ui` over raw HTML when available.
- Use provided `variant`, `size`, and `asChild` props instead of ad-hoc classes.
- Keep layout simple: flex/grid with Tailwind `gap`, `items`, `justify`, `rounded`, `shadow`, etc.

### Tooltips (CRITICAL)

- ONLY use shadcn Tooltip:

```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button size="icon" variant="ghost">?</Button>
    </TooltipTrigger>
    <TooltipContent side="top">Helpful text</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Icons

- Use `lucide-react` only; no custom SVGs.
- Size icons with Tailwind classes (`className="h-4 w-4"`). No inline `width`/`height`.

---

## TypeScript Rules

- Define an `interface` for all component props; use `type` for unions/utility shapes.
- Export interfaces when used elsewhere.
- Avoid `switch` statements for mapping; prefer object maps:

```tsx
const statusLabels: Record<Status, string> = { loading: "Loading...", success: "Done!", error: "Failed" };
const getLabel = (status: Status) => statusLabels[status] ?? "Unknown";
```

For JSX content, use `ReactNode` maps:

```tsx
const statusContent: Record<Status, ReactNode> = {
  loading: <Spinner />,
  success: <p className="text-green-600">Done!</p>,
  error: <p className="text-destructive">Failed</p>,
};
```

---

## Import Order

1) React imports
2) Third-party libraries (shadcn UI, lucide-react, clsx/cn)
3) Internal imports (components, hooks, connectors, types)
4) Styles (rare) — always last

---

## Naming Conventions

- Components: PascalCase (`ChatInput`)
- Files: PascalCase (`ChatInput.tsx`)
- Directories: PascalCase (`ChatInput/`)
- Custom CSS classes: kebab-case (`chat-input-wrapper`)
- Functions: camelCase; Event handlers: `handleX`; Callback props: `onX`; Interfaces: PascalCase.

---

## Path Aliases

Use configured aliases instead of relative imports.

```ts
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
```

---

## Local Storage & Persistence

NEVER:
- Access `localStorage` directly inside components/effects.
- Store secrets, tokens, or large payloads in `localStorage`.
- Assume `window` exists (SSR/Electron safety).

ALWAYS:
- Keep persistence helpers in `@/services/*` or dedicated stores; expose typed methods (`load`, `save`, `clear`) and reuse namespaced keys (e.g., `galactic-ide:<feature>`).
- Guard access with `typeof window !== "undefined"` and wrap parse/stringify in try/catch, returning safe defaults on failure.
- Validate stored shapes (zod or type guards) before use and drop invalid records instead of throwing.
- Emit and respond to custom events (e.g., `"galactic-projects-updated"`) when cross-tab sync matters.
- Prefer transient UI state in React/Zustand; persist only what must survive reloads.

---

## Platform & OS-Aware Logic (Windows/macOS/Linux)

- Centralize OS detection/helpers in `@/services/os` (and sibling services); components should consume normalized values, not query the platform directly.
- Avoid scattering `process.platform`/`navigator` checks; expose a helper returning `windows | macos | linux | unknown` and branch via object maps instead of `switch`/`if` chains.
- Let Electron/main handle filesystem dialogs, path normalization, and command construction; call through `window.electronAPI` or service wrappers rather than building OS-specific paths/CLI strings in the renderer.
- Prefer capability checks ("can open external editor", "supports notifications") over OS name checks; always include a safe fallback for `unknown`.
- Keep cross-OS commands declarative (object map per OS) and avoid shell-specific syntax; ensure Windows paths/commands are quoted and use argument arrays where possible to prevent quoting bugs.

---

## Git Operations

NEVER:
- Shell out to git directly from components/hooks.
- Assume POSIX-only paths or shells when building git commands.

ALWAYS:
- Route git work through `@/services/git` and `window.electronAPI` so the main process handles path/command differences across Windows/macOS/Linux.
- Validate inputs (projectPath, branch) before calling; return typed `{ success, error }` or arrays and handle "not a git repo" gracefully.
- Keep operations async and non-blocking; surface loading/progress/error states in the UI without freezing rendering.
- For new git capabilities, extend the service/main layer first, add defensive logging, and prefer command arrays over concatenated strings to avoid quoting issues.

---

## Code Hygiene

- Add comments only when needed—for rationale, invariants, tricky edge cases, or security concerns. Never comment self-explanatory code.
- When finishing a feature, review for unused code introduced during development and remove it before considering the work done.

---

## Component Example

```tsx
import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex items-center gap-2 rounded-md border bg-card/70 p-3", disabled && "opacity-60 pointer-events-none")}> 
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type a message..."
        className="flex-1"
      />
      <Button type="submit" size="icon" variant="secondary">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
```