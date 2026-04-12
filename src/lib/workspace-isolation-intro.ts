export const WORKSPACE_ISOLATION_PORT_READY_FRAMEWORKS = [
  "Next.js",
  "Express",
  "Nuxt",
] as const;

export const WORKSPACE_ISOLATION_INJECTED_FRAMEWORKS = [
  "Vite",
  "Astro",
  "React Router",
  "Angular",
  "Expo",
  "React Native",
] as const;

export const getWorkspaceIsolationSupportCopy = (): string =>
  `Most common dev frameworks already respect PORT automatically, including ${WORKSPACE_ISOLATION_PORT_READY_FRAMEWORKS.join(
    ", ",
  )}. For ${WORKSPACE_ISOLATION_INJECTED_FRAMEWORKS.join(
    ", ",
  )}, Galactic handles the host and port wiring for you. SvelteKit is covered via Vite.`;

export const WORKSPACE_ISOLATION_SHELL_SUPPORT_COPY =
  "Terminal Auto-Env currently supports zsh only.";
